import { Response } from 'express';
import mongoose from 'mongoose';
import Asset, { IAsset } from '../models/Asset';
import BorrowRequest from '../models/BorrowRequest';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * @desc    Create a new asset listing
 * @route   POST /api/assets
 * @access  Private
 *
 * The authenticated user (via `protect` middleware) is automatically
 * set as the `owner` — this field is never accepted from the request
 * body, preventing a malicious client from creating assets on another
 * user's behalf.
 */
export const createAsset = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    const { name, description, category } = req.body;

    if (!name || !description || !category) {
      res.status(400).json({
        success: false,
        message: 'Please provide name, description, and category',
      });
      return;
    }

    const asset: IAsset = await Asset.create({
      name: String(name).trim(),
      description: String(description).trim(),
      category: String(category).trim(),
      owner: req.user._id,
      // status intentionally omitted -> defaults to 'available'
    });

    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      data: asset,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    console.error('Create asset error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating asset' });
  }
};

/**
 * @desc    Get all assets (with optional filtering/search)
 * @route   GET /api/assets
 * @access  Public
 *
 * Supports optional query params:
 *   - status: filter by asset status ('available' | 'requested' | 'borrowed')
 *   - category: filter by category (case-insensitive exact match)
 *   - search: full-text search across name/description/category
 *   - owner: filter by ownership. Accepts either:
 *       - 'me' -> resolves to the authenticated user's own assets
 *         (requires a valid JWT; returns 401 if used while logged out)
 *       - a raw ObjectId string -> filter by that exact owner
 *
 * Always populates `owner` with safe, non-sensitive fields only
 * (name + email) — never the password, even though it's excluded
 * by default at the schema level, this is defense-in-depth.
 */
export const getAssets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, category, search, owner } = req.query;

    const filter: Record<string, unknown> = {};

    if (status && ['available', 'requested', 'borrowed'].includes(String(status))) {
      filter.status = status;
    }

    if (category) {
      filter.category = { $regex: `^${String(category)}$`, $options: 'i' };
    }

    if (search) {
      filter.$text = { $search: String(search) };
    }

    if (owner === 'me') {
      // 'owner=me' requires authentication — protect middleware isn't
      // applied to this public route, so we check req.user manually
      // here rather than gating the entire route behind auth.
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required to filter by owner=me',
        });
        return;
      }
      filter.owner = req.user._id;
    } else if (owner && mongoose.Types.ObjectId.isValid(String(owner))) {
      filter.owner = owner;
    }

    const assets = await Asset.find(filter)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assets.length,
      data: assets,
    });
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching assets' });
  }
};

/**
 * @desc    Get a single asset by ID
 * @route   GET /api/assets/:id
 * @access  Public
 */
export const getAssetById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid asset ID' });
      return;
    }

    const asset = await Asset.findById(id).populate('owner', 'name email');

    if (!asset) {
      res.status(404).json({ success: false, message: 'Asset not found' });
      return;
    }

    res.status(200).json({ success: true, data: asset });
  } catch (error) {
    console.error('Get asset by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching asset' });
  }
};

/**
 * @desc    Update an asset (owner-only)
 * @route   PUT /api/assets/:id
 * @access  Private
 *
 * Only the asset's owner may update it. `status` is deliberately
 * excluded from the set of client-editable fields here — status
 * transitions are exclusively controlled by the BorrowRequest workflow
 * (create/approve/reject) in borrowRequestController.ts, never by a
 * direct PUT from the owner. This prevents an owner from manually
 * flipping status in a way that desyncs it from an active request.
 */
export const updateAsset = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

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

    if (asset.owner.toString() !== req.user._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to update this asset',
      });
      return;
    }

    const { name, description, category } = req.body;

    if (name !== undefined) asset.name = String(name).trim();
    if (description !== undefined) asset.description = String(description).trim();
    if (category !== undefined) asset.category = String(category).trim();

    const updatedAsset = await asset.save();

    res.status(200).json({
      success: true,
      message: 'Asset updated successfully',
      data: updatedAsset,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    console.error('Update asset error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating asset' });
  }
};

/**
 * @desc    Delete an asset (owner-only)
 * @route   DELETE /api/assets/:id
 * @access  Private
 *
 * Guards against deleting an asset that has an active (pending or
 * approved) borrow request — this prevents orphaning a BorrowRequest
 * document that points to a now-nonexistent asset, and prevents a
 * dishonest owner from deleting an item to dodge an approved loan.
 */
export const deleteAsset = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    const { id } = req.params;

    if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid asset ID' });
      return;
    }

    const asset = await Asset.findById(id);
    // ... rest unchanged

    if (!asset) {
      res.status(404).json({ success: false, message: 'Asset not found' });
      return;
    }

    if (asset.owner.toString() !== req.user._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to delete this asset',
      });
      return;
    }

    const activeRequest = await BorrowRequest.findOne({
      asset: asset._id,
      status: { $in: ['pending', 'approved'] },
    });

    if (activeRequest) {
      res.status(409).json({
        success: false,
        message:
          'Cannot delete an asset with an active or pending borrow request. Resolve it first.',
      });
      return;
    }

    await asset.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Asset deleted successfully',
    });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting asset' });
  }
};