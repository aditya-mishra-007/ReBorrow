import { Response } from 'express';
import { Types } from 'mongoose';
import Asset from '../models/Asset';
import { AuthRequest } from '../middleware/authMiddleware';

export const getAssets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assets = await Asset.find({ isAvailable: true }).populate('owner', 'name email');
    res.status(200).json(assets);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createAsset = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Please add all required fields' });
    }

    const ownerId = req.user?._id;

    if (!ownerId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const asset = await Asset.create({
      title,
      description,
      category,
      owner: ownerId as any
    });

    return res.status(201).json(asset);
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};