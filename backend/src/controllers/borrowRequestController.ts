import { Response } from 'express';
import mongoose from 'mongoose';
import BorrowRequest, { IBorrowRequest } from '../models/BorrowRequest';
import Asset from '../models/Asset';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  sendBorrowRequestCreatedEmail,
  sendBorrowRequestApprovedEmail,
  sendBorrowRequestRejectedEmail,
} from '../services/emailService';

/**
 * formatDateForEmail
 * ------------------------------------------------------------------
 * Renders a Date as a short, human-readable string for use in email
 * templates (e.g., "Aug 10, 2026") rather than a raw ISO timestamp.
 */
function formatDateForEmail(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * @desc    Create a new borrow request for an asset
 * @route   POST /api/borrow-requests
 * @access  Private
 *
 * Business rules enforced here:
 * 1. A user cannot request to borrow their own asset.
 * 2. The target asset must currently be 'available' (prevents
 *    duplicate/competing requests on the same item).
 * 3. On successful creation, the asset's status flips from
 *    'available' -> 'requested'.
 *
 * Uses a MongoDB transaction (session) to guarantee that the
 * BorrowRequest creation and the Asset status update either both
 * succeed or both fail — preventing a desynced state where a request
 * exists but the asset still shows 'available' (or vice versa).
 */
export const createBorrowRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();

  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    const { asset: assetId, startDate, endDate } = req.body;

    if (!assetId || !startDate || !endDate) {
      res.status(400).json({
        success: false,
        message: 'Please provide asset, startDate, and endDate',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(assetId)) {
      res.status(400).json({ success: false, message: 'Invalid asset ID' });
      return;
    }

    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);

    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid date format' });
      return;
    }

    if (parsedEnd <= parsedStart) {
      res.status(400).json({
        success: false,
        message: 'End date must be after start date',
      });
      return;
    }

    let createdRequest: IBorrowRequest | null = null;

    await session.withTransaction(async () => {
      const asset = await Asset.findById(assetId).session(session);

      if (!asset) {
        throw new Error('ASSET_NOT_FOUND');
      }

      // Rule: Cannot borrow your own asset
      if (asset.owner.toString() === req.user!._id.toString()) {
        throw new Error('SELF_BORROW_FORBIDDEN');
      }

      // Rule: Asset must be available to request
      if (asset.status !== 'available') {
        throw new Error('ASSET_NOT_AVAILABLE');
      }

      const requestDocs = await BorrowRequest.create(
        [
          {
            asset: asset._id,
            requester: req.user!._id,
            startDate: parsedStart,
            endDate: parsedEnd,
            status: 'pending',
          },
        ],
        { session }
      );

      createdRequest = requestDocs[0] ?? null;

      // Cascade: available -> requested
      asset.status = 'requested';
      await asset.save({ session });
    });

    const populatedRequest = await BorrowRequest.findById(createdRequest!._id)
      .populate('asset')
      .populate('requester', 'name email');

    res.status(201).json({
      success: true,
      message: 'Borrow request created successfully',
      data: populatedRequest,
    });

    // --- Fire-and-forget email notification to the asset owner ---
    // Deliberately sent AFTER the response is already returned to the
    // client, and wrapped in its own try-catch: email delivery is a
    // notification nicety, never a blocker for the actual borrow
    // request transaction, which has already fully succeeded by this
    // point regardless of what happens below.
    try {
      const assetDoc = await Asset.findById(assetId).populate<{
        owner: { name: string; email: string };
      }>('owner', 'name email');

      if (assetDoc && typeof assetDoc.owner === 'object') {
        await sendBorrowRequestCreatedEmail({
          to: assetDoc.owner.email,
          recipientName: assetDoc.owner.name,
          requesterName: req.user!.name,
          assetName: assetDoc.name,
          startDate: formatDateForEmail(parsedStart),
          endDate: formatDateForEmail(parsedEnd),
        });
      }
    } catch (emailError) {
      console.error('Failed to send borrow request created email (non-fatal):', emailError);
    }
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'ASSET_NOT_FOUND':
          res.status(404).json({ success: false, message: 'Asset not found' });
          return;
        case 'SELF_BORROW_FORBIDDEN':
          res.status(403).json({
            success: false,
            message: 'You cannot request to borrow your own asset',
          });
          return;
        case 'ASSET_NOT_AVAILABLE':
          res.status(409).json({
            success: false,
            message: 'This asset is not currently available for borrowing',
          });
          return;
        case 'ValidationError':
          res.status(400).json({ success: false, message: error.message });
          return;
      }
    }

    console.error('Create borrow request error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating borrow request' });
  } finally {
    await session.endSession();
  }
};

/**
 * @desc    Get all borrow requests made BY the current user (as requester)
 * @route   GET /api/borrow-requests/my-requests
 * @access  Private
 */
export const getMyBorrowRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    const requests = await BorrowRequest.find({ requester: req.user._id })
      .populate('asset')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    console.error('Get my borrow requests error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching your requests' });
  }
};

/**
 * @desc    Get all borrow requests made ON the current user's assets (as owner)
 * @route   GET /api/borrow-requests/incoming
 * @access  Private
 *
 * This powers the "requests awaiting my decision" view for an asset
 * owner. Requires a two-step lookup: first find all asset IDs owned
 * by this user, then find BorrowRequests referencing those assets.
 */
export const getIncomingBorrowRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    const ownedAssetIds = await Asset.find({ owner: req.user._id }).distinct('_id');

    const requests = await BorrowRequest.find({ asset: { $in: ownedAssetIds } })
      .populate('asset')
      .populate('requester', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    console.error('Get incoming borrow requests error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching incoming requests' });
  }
};

/**
 * @desc    Approve a pending borrow request (asset owner only)
 * @route   PATCH /api/borrow-requests/:id/approve
 * @access  Private
 *
 * Business rules enforced here:
 * 1. Only the owner of the underlying asset may approve.
 * 2. Only a 'pending' request may be approved.
 * 3. Cascade: asset status 'requested' -> 'borrowed'.
 *
 * Wrapped in a transaction for the same atomicity guarantee as creation.
 */
export const approveBorrowRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();

  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    const { id } = req.params;

    if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid borrow request ID' });
      return;
  }

    await session.withTransaction(async () => {
      const borrowRequest = await BorrowRequest.findById(id).session(session);

      if (!borrowRequest) {
        throw new Error('REQUEST_NOT_FOUND');
      }

      const asset = await Asset.findById(borrowRequest.asset).session(session);

      if (!asset) {
        throw new Error('ASSET_NOT_FOUND');
      }

      if (asset.owner.toString() !== req.user!._id.toString()) {
        throw new Error('NOT_OWNER');
      }

      if (borrowRequest.status !== 'pending') {
        throw new Error('REQUEST_NOT_PENDING');
      }

      borrowRequest.status = 'approved';
      await borrowRequest.save({ session });

      // Cascade: requested -> borrowed
      asset.status = 'borrowed';
      await asset.save({ session });
    });

    const updatedRequest = await BorrowRequest.findById(id)
      .populate('asset')
      .populate('requester', 'name email');

    res.status(200).json({
      success: true,
      message: 'Borrow request approved successfully',
      data: updatedRequest,
    });

    // --- Fire-and-forget email notification to the requester ---
    try {
      if (
        updatedRequest &&
        typeof updatedRequest.asset === 'object' &&
        typeof updatedRequest.requester === 'object'
      ) {
        const assetDoc = updatedRequest.asset as unknown as { name: string };
        const requesterDoc = updatedRequest.requester as unknown as { name: string; email: string };

        await sendBorrowRequestApprovedEmail({
          to: requesterDoc.email,
          recipientName: requesterDoc.name,
          assetName: assetDoc.name,
          startDate: formatDateForEmail(updatedRequest.startDate),
          endDate: formatDateForEmail(updatedRequest.endDate),
        });
      }
    } catch (emailError) {
      console.error('Failed to send approval email (non-fatal):', emailError);
    }
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'REQUEST_NOT_FOUND':
          res.status(404).json({ success: false, message: 'Borrow request not found' });
          return;
        case 'ASSET_NOT_FOUND':
          res.status(404).json({ success: false, message: 'Associated asset not found' });
          return;
        case 'NOT_OWNER':
          res.status(403).json({
            success: false,
            message: 'Only the asset owner can approve this request',
          });
          return;
        case 'REQUEST_NOT_PENDING':
          res.status(409).json({
            success: false,
            message: 'Only pending requests can be approved',
          });
          return;
      }
    }

    console.error('Approve borrow request error:', error);
    res.status(500).json({ success: false, message: 'Server error while approving request' });
  } finally {
    await session.endSession();
  }
};

/**
 * @desc    Reject a pending borrow request (asset owner only)
 * @route   PATCH /api/borrow-requests/:id/reject
 * @access  Private
 *
 * Business rules enforced here:
 * 1. Only the owner of the underlying asset may reject.
 * 2. Only a 'pending' request may be rejected.
 * 3. Cascade: asset status safely resets 'requested' -> 'available'.
 */
export const rejectBorrowRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();

  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    const { id } = req.params;

    if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid borrow request ID' });
      return;
    }

    await session.withTransaction(async () => {
      const borrowRequest = await BorrowRequest.findById(id).session(session);

      if (!borrowRequest) {
        throw new Error('REQUEST_NOT_FOUND');
      }

      const asset = await Asset.findById(borrowRequest.asset).session(session);

      if (!asset) {
        throw new Error('ASSET_NOT_FOUND');
      }

      if (asset.owner.toString() !== req.user!._id.toString()) {
        throw new Error('NOT_OWNER');
      }

      if (borrowRequest.status !== 'pending') {
        throw new Error('REQUEST_NOT_PENDING');
      }

      borrowRequest.status = 'rejected';
      await borrowRequest.save({ session });

      // Cascade: safely reset requested -> available
      asset.status = 'available';
      await asset.save({ session });
    });

    const updatedRequest = await BorrowRequest.findById(id)
      .populate('asset')
      .populate('requester', 'name email');

    res.status(200).json({
      success: true,
      message: 'Borrow request rejected successfully',
      data: updatedRequest,
    });

    // --- Fire-and-forget email notification to the requester ---
    try {
      if (
        updatedRequest &&
        typeof updatedRequest.asset === 'object' &&
        typeof updatedRequest.requester === 'object'
      ) {
        const assetDoc = updatedRequest.asset as unknown as { name: string };
        const requesterDoc = updatedRequest.requester as unknown as { name: string; email: string };

        await sendBorrowRequestRejectedEmail({
          to: requesterDoc.email,
          recipientName: requesterDoc.name,
          assetName: assetDoc.name,
          startDate: formatDateForEmail(updatedRequest.startDate),
          endDate: formatDateForEmail(updatedRequest.endDate),
        });
      }
    } catch (emailError) {
      console.error('Failed to send rejection email (non-fatal):', emailError);
    }
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'REQUEST_NOT_FOUND':
          res.status(404).json({ success: false, message: 'Borrow request not found' });
          return;
        case 'ASSET_NOT_FOUND':
          res.status(404).json({ success: false, message: 'Associated asset not found' });
          return;
        case 'NOT_OWNER':
          res.status(403).json({
            success: false,
            message: 'Only the asset owner can reject this request',
          });
          return;
        case 'REQUEST_NOT_PENDING':
          res.status(409).json({
            success: false,
            message: 'Only pending requests can be rejected',
          });
          return;
      }
    }

    console.error('Reject borrow request error:', error);
    res.status(500).json({ success: false, message: 'Server error while rejecting request' });
  } finally {
    await session.endSession();
  }
};


/**
 * @desc    Cancel a pending borrow request (requester only)
 * @route   PATCH /api/borrow-requests/:id/cancel
 * @access  Private
 *
 * Business rules enforced here:
 * 1. Only the original requester may cancel their own request.
 * 2. Only a 'pending' request may be cancelled — once approved or
 *    rejected, the request is a closed record, not cancellable.
 * 3. Cascade: asset status safely resets 'requested' -> 'available',
 *    identical to the reject flow, since a cancellation has the same
 *    downstream effect on the asset as an owner's rejection.
 *
 * Wrapped in a transaction for the same atomicity guarantee as
 * create/approve/reject.
 */
export const cancelBorrowRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();

  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    const { id } = req.params;

    if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid borrow request ID' });
      return;
    }

    await session.withTransaction(async () => {
      const borrowRequest = await BorrowRequest.findById(id).session(session);

      if (!borrowRequest) {
        throw new Error('REQUEST_NOT_FOUND');
      }

      if (borrowRequest.requester.toString() !== req.user!._id.toString()) {
        throw new Error('NOT_REQUESTER');
      }

      if (borrowRequest.status !== 'pending') {
        throw new Error('REQUEST_NOT_PENDING');
      }

      const asset = await Asset.findById(borrowRequest.asset).session(session);

      if (!asset) {
        throw new Error('ASSET_NOT_FOUND');
      }

      // Deleting the request entirely (rather than marking it
      // 'cancelled') keeps the BorrowRequestStatus enum unchanged and
      // matches the mental model of "withdrawing" a request that was
      // never acted upon — there's no meaningful record to keep, unlike
      // an approved/rejected request which represents a real decision.
      await borrowRequest.deleteOne({ session });

      // Cascade: safely reset requested -> available
      asset.status = 'available';
      await asset.save({ session });
    });

    res.status(200).json({
      success: true,
      message: 'Borrow request cancelled successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'REQUEST_NOT_FOUND':
          res.status(404).json({ success: false, message: 'Borrow request not found' });
          return;
        case 'ASSET_NOT_FOUND':
          res.status(404).json({ success: false, message: 'Associated asset not found' });
          return;
        case 'NOT_REQUESTER':
          res.status(403).json({
            success: false,
            message: 'Only the original requester can cancel this request',
          });
          return;
        case 'REQUEST_NOT_PENDING':
          res.status(409).json({
            success: false,
            message: 'Only pending requests can be cancelled',
          });
          return;
      }
    }

    console.error('Cancel borrow request error:', error);
    res.status(500).json({ success: false, message: 'Server error while cancelling request' });
  } finally {
    await session.endSession();
  }
};