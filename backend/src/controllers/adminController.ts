import { Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Asset from '../models/Asset';
import BorrowRequest from '../models/BorrowRequest';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * adminController.ts
 * ------------------------------------------------------------------
 * All handlers here assume they're reached only via routes protected
 * by BOTH `protect` AND `authorizeRoles('admin')` (see adminRoutes.ts)
 * — so req.user is guaranteed to exist and have role === 'admin' by
 * the time any of these run. No redundant admin checks needed inside
 * these functions themselves.
 */

/**
 * @desc    Get platform-wide summary statistics
 * @route   GET /api/admin/stats
 * @access  Private (admin only)
 */
export const getStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [userCount, assetCount, requestCount, pendingCount, approvedCount] = await Promise.all([
      User.countDocuments(),
      Asset.countDocuments(),
      BorrowRequest.countDocuments(),
      BorrowRequest.countDocuments({ status: 'pending' }),
      BorrowRequest.countDocuments({ status: 'approved' }),
    ]);

    const assetsByStatus = await Asset.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusBreakdown = { available: 0, requested: 0, borrowed: 0 };
    for (const entry of assetsByStatus) {
      if (entry._id in statusBreakdown) {
        statusBreakdown[entry._id as keyof typeof statusBreakdown] = entry.count;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalUsers: userCount,
        totalAssets: assetCount,
        totalBorrowRequests: requestCount,
        pendingRequests: pendingCount,
        approvedRequests: approvedCount,
        assetsByStatus: statusBreakdown,
      },
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching stats' });
  }
};

/**
 * @desc    Get all users (paginated)
 * @route   GET /api/admin/users
 * @access  Private (admin only)
 */
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
    const skip = (page - 1) * limit;

    const [totalCount, users] = await Promise.all([
      User.countDocuments(),
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
        totalCount,
        limit,
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching users' });
  }
};

/**
 * @desc    Delete any user (admin moderation action)
 * @route   DELETE /api/admin/users/:id
 * @access  Private (admin only)
 *
 * Also cascades: deletes all assets owned by this user, and all
 * borrow requests either made by them or targeting their assets —
 * otherwise deleting a user would leave orphaned references
 * throughout the database.
 */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;

    if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' });
      return;
    }

    // Prevent an admin from deleting their own account through this
    // moderation endpoint — self-deletion (if ever needed) should be
    // a deliberate, separate account-settings flow, not a click away
    // inside a user-management table.
    if (req.user!._id.toString() === id) {
      res.status(400).json({
        success: false,
        message: 'You cannot delete your own account from the admin dashboard',
      });
      return;
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    await session.withTransaction(async () => {
      const ownedAssetIds = await Asset.find({ owner: id }).distinct('_id').session(session);

      await BorrowRequest.deleteMany(
        { $or: [{ requester: id }, { asset: { $in: ownedAssetIds } }] },
        { session }
      );
      await Asset.deleteMany({ owner: id }, { session });
      await User.deleteOne({ _id: id }, { session });
    });

    res.status(200).json({
      success: true,
      message: 'User and all associated data deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting user' });
  } finally {
    await session.endSession();
  }
};

/**
 * @desc    Change a user's role (promote to admin / demote to user)
 * @route   PATCH /api/admin/users/:id/role
 * @access  Private (admin only)
 */
export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' });
      return;
    }

    if (role !== 'user' && role !== 'admin') {
      res.status(400).json({ success: false, message: "Role must be 'user' or 'admin'" });
      return;
    }

    if (req.user!._id.toString() === id) {
      res.status(400).json({
        success: false,
        message: 'You cannot change your own role',
      });
      return;
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    targetUser.role = role;
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: `User role updated to '${role}'`,
      data: targetUser,
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating user role' });
  }
};

/**
 * @desc    Get all assets platform-wide (paginated, no status/owner filtering needed)
 * @route   GET /api/admin/assets
 * @access  Private (admin only)
 */
export const getAllAssetsAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
    const skip = (page - 1) * limit;

    const [totalCount, assets] = await Promise.all([
      Asset.countDocuments(),
      Asset.find()
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json({
      success: true,
      data: assets,
      pagination: {
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
        totalCount,
        limit,
      },
    });
  } catch (error) {
    console.error('Get all assets (admin) error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching assets' });
  }
};

/**
 * @desc    Delete any asset (admin moderation action — no ownership check)
 * @route   DELETE /api/admin/assets/:id
 * @access  Private (admin only)
 *
 * Unlike the regular deleteAsset in assetController.ts, this bypasses
 * the owner-only check (admins can remove any listing, e.g. for
 * policy violations) AND bypasses the active-borrow-request guard —
 * an admin removing a problematic listing should not be blocked by
 * an in-progress borrow, though we do clean up any associated
 * requests to avoid orphaned data.
 */
export const deleteAssetAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;

    if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid asset ID' });
      return;
    }

    const asset = await Asset.findById(id);
    if (!asset) {
      res.status(404).json({ success: false, message: 'Asset not found' });
      return;
    }

    await session.withTransaction(async () => {
      await BorrowRequest.deleteMany({ asset: id }, { session });
      await Asset.deleteOne({ _id: id }, { session });
    });

    res.status(200).json({
      success: true,
      message: 'Asset deleted successfully (admin action)',
    });
  } catch (error) {
    console.error('Delete asset (admin) error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting asset' });
  } finally {
    await session.endSession();
  }
};