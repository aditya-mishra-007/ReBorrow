import { Response } from 'express';
import mongoose from 'mongoose';
import Asset, { IAsset } from '../models/Asset';
import BorrowRequest from '../models/BorrowRequest';
import { AuthRequest } from '../middleware/authMiddleware';
import cloudinary from '../config/cloudinary';

/**
 * uploadBufferToCloudinary
 * ------------------------------------------------------------------
 * Wraps Cloudinary's upload_stream (callback-based) in a Promise so
 * it can be awaited alongside the rest of this file's async/await
 * style. Uploads are scoped to a 'reborrow/assets' folder in your
 * Cloudinary account for organization, and images are auto-optimized
 * (quality/format) by Cloudinary on delivery via the returned URL's
 * transformation parameters.
 */
function uploadBufferToCloudinary(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'reborrow/assets',
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary upload failed with no error detail'));
          return;
        }
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

/**
 * getCloudinaryPublicId
 * ------------------------------------------------------------------
 * Extracts the public_id Cloudinary needs for deletion from a stored
 * secure_url. Cloudinary URLs look like:
 *   https://res.cloudinary.com/<cloud>/image/upload/v169.../reborrow/assets/abc123.jpg
 * The public_id is everything after the version segment (v169...),
 * minus the file extension: 'reborrow/assets/abc123'
 */
function getCloudinaryPublicId(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
  return match?.[1] || null;
}

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

    const { name, description, category, city, latitude, longitude } = req.body;

    if (!name || !description || !category) {
      res.status(400).json({
        success: false,
        message: 'Please provide name, description, and category',
      });
      return;
    }

    // Location is entirely optional — an asset can be listed without
    // it, and will simply be excluded from "near me" searches (but
    // still shows normally in the regular, non-location browse view).
    let location: { city?: string; coordinates?: { type: 'Point'; coordinates: [number, number] } } | undefined;

    if (latitude && longitude) {
      const lat = parseFloat(String(latitude));
      const lng = parseFloat(String(longitude));

      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        location = {
          city: city ? String(city).trim() : undefined,
          coordinates: { type: 'Point', coordinates: [lng, lat] }, // GeoJSON order: [lng, lat]
        };
      }
    }

    // req.files is populated by the uploadAssetImages multer middleware
    // (see uploadMiddleware.ts). Images are optional — a listing can be
    // created with zero images, matching the pre-existing behavior.
    const files = (req.files as Express.Multer.File[] | undefined) || [];

    let imageUrls: string[] = [];
    if (files.length > 0) {
      try {
        imageUrls = await Promise.all(files.map((file) => uploadBufferToCloudinary(file.buffer)));
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        res.status(502).json({
          success: false,
          message: 'Failed to upload one or more images. Please try again.',
        });
        return;
      }
    }

    const asset: IAsset = await Asset.create({
      name: String(name).trim(),
      description: String(description).trim(),
      category: String(category).trim(),
      owner: req.user._id,
      images: imageUrls,
      location,
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
 * @desc    Get all assets (with optional filtering/search/pagination)
 * @route   GET /api/assets
 * @access  Public
 *
 * Supports optional query params:
 *   - status: filter by asset status ('available' | 'requested' | 'borrowed')
 *   - category: filter by category (case-insensitive exact match)
 *   - search: full-text search across name/description/category
 *   - owner: filter by ownership ('me' or a raw ObjectId string)
 *   - page: 1-indexed page number (default: 1)
 *   - limit: results per page (default: 12, max: 50 to prevent abuse)
 *
 * Response includes pagination metadata alongside `data` so the
 * frontend can render page controls without a separate count request.
 */
export const getAssets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, category, search, owner, page, limit } = req.query;

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

    // --- Pagination parsing ---
    // Parsed defensively: non-numeric or missing values fall back to
    // sane defaults rather than producing NaN, which would break the
    // Mongoose .skip()/.limit() calls below.
    const parsedPage = Math.max(1, parseInt(String(page), 10) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(String(limit), 10) || 12));
    const skip = (parsedPage - 1) * parsedLimit;

    // Run the count and the paginated fetch concurrently — they're
    // independent reads against the same filter, so there's no reason
    // to wait for one before starting the other.
    const [totalCount, assets] = await Promise.all([
      Asset.countDocuments(filter),
      Asset.find(filter)
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / parsedLimit));

    res.status(200).json({
      success: true,
      count: assets.length,
      data: assets,
      pagination: {
        currentPage: parsedPage,
        totalPages,
        totalCount,
        limit: parsedLimit,
      },
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


/**
 * @desc    Delete a single image from an asset (owner-only)
 * @route   DELETE /api/assets/:id/images
 * @access  Private
 *
 * Expects `{ imageUrl: string }` in the request body — the exact URL
 * to remove, as returned in the asset's `images` array. Removes it
 * both from Cloudinary storage (freeing your account's quota) and
 * from the Asset document's images array.
 */
export const deleteAssetImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    const { id } = req.params;
    const { imageUrl } = req.body;

    if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid asset ID' });
      return;
    }

    if (!imageUrl || typeof imageUrl !== 'string') {
      res.status(400).json({ success: false, message: 'imageUrl is required' });
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
        message: 'Not authorized to modify this asset',
      });
      return;
    }

    if (!asset.images.includes(imageUrl)) {
      res.status(404).json({ success: false, message: 'Image not found on this asset' });
      return;
    }

    // Attempt Cloudinary deletion, but don't let a Cloudinary-side
    // failure block removing the (possibly already-broken) reference
    // from our own database — an orphaned Cloudinary asset costs
    // nothing critical, whereas a stuck broken-image reference in the
    // UI is the worse user-facing outcome.
    const publicId = getCloudinaryPublicId(imageUrl);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error('Cloudinary deletion warning (non-fatal):', cloudinaryError);
      }
    }

    asset.images = asset.images.filter((url) => url !== imageUrl);
    await asset.save();

    res.status(200).json({
      success: true,
      message: 'Image removed successfully',
      data: asset,
    });
  } catch (error) {
    console.error('Delete asset image error:', error);
    res.status(500).json({ success: false, message: 'Server error while removing image' });
  }
};


/**
 * @desc    Get assets near a given coordinate, sorted by distance
 * @route   GET /api/assets/nearby
 * @access  Public
 *
 * Query params:
 *   - lat, lng: required, the search origin coordinates
 *   - radius: search radius in kilometers (default: 25, max: 100)
 *   - status/category: same optional filters as the main getAssets
 *
 * Uses MongoDB's $geoNear aggregation stage, which REQUIRES being the
 * first stage in the pipeline and requires the 2dsphere index declared
 * on Asset.ts's location.coordinates field. Returns assets sorted by
 * ascending distance from the given point (nearest first) — $geoNear
 * does this sorting automatically, no separate .sort() needed.
 */
export const getNearbyAssets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lat, lng, radius, status, category } = req.query;

    const latitude = parseFloat(String(lat));
    const longitude = parseFloat(String(lng));

    if (isNaN(latitude) || isNaN(longitude)) {
      res.status(400).json({
        success: false,
        message: 'Valid lat and lng query parameters are required',
      });
      return;
    }

    const radiusKm = Math.min(1500, Math.max(1, parseFloat(String(radius)) || 25));

    const matchFilter: Record<string, unknown> = {};
    if (status && ['available', 'requested', 'borrowed'].includes(String(status))) {
      matchFilter.status = status;
    }
    if (category) {
      matchFilter.category = { $regex: `^${String(category)}$`, $options: 'i' };
    }

    const assets = await Asset.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'distanceMeters',
          maxDistance: radiusKm * 1000, // $geoNear distance is in meters
          spherical: true,
          query: matchFilter,
        },
      },
      { $limit: 100 }, // safety cap — this endpoint isn't paginated, so bound the result set
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'owner',
        },
      },
      { $unwind: '$owner' },
      {
        $project: {
          name: 1,
          description: 1,
          category: 1,
          status: 1,
          images: 1,
          location: 1,
          createdAt: 1,
          updatedAt: 1,
          distanceMeters: 1,
          'owner._id': 1,
          'owner.name': 1,
          'owner.email': 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: assets.length,
      data: assets,
    });
  } catch (error) {
    console.error('Get nearby assets error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching nearby assets' });
  }
};




