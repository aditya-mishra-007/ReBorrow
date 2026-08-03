// backend/src/controllers/borrowController.ts
import { Response } from 'express';
import { AuthRequest } from './assetController';
import BorrowRequest from '../models/BorrowRequest';
import Asset from '../models/Asset';

// Create a request to borrow an asset
export const createBorrowRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { assetId, startDate, endDate } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    if (!asset.isAvailable) {
      return res.status(400).json({ message: 'Asset is currently not available' });
    }

    // Prevent owners from borrowing their own item
    if (asset.owner.toString() === req.user?.id) {
      return res.status(400).json({ message: 'You cannot borrow your own asset' });
    }

    const request = await BorrowRequest.create({
      asset: assetId,
      borrower: req.user?.id,
      owner: asset.owner,
      startDate,
      endDate,
    });

    return res.status(201).json(request);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating borrow request', error });
  }
};

// Fetch requests sent by user or received by user
export const getUserRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await BorrowRequest.find({
      $or: [{ borrower: req.user?.id }, { owner: req.user?.id }],
    })
      .populate('asset', 'title category')
      .populate('borrower', 'name email')
      .populate('owner', 'name email');

    return res.status(200).json(requests);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching requests', error });
  }
};

// Update request status (Approve / Reject)
export const updateRequestStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' | 'rejected'

    const request = await BorrowRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only owner can approve/reject
    if (request.owner.toString() !== req.user?.id) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    request.status = status;
    await request.save();

    // If approved, set asset to unavailable
    if (status === 'approved') {
      await Asset.findByIdAndUpdate(request.asset, { isAvailable: false });
    }

    return res.status(200).json(request);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating request status', error });
  }
};