// backend/src/controllers/assetController.ts
import { Request, Response } from 'express';
import Asset from '../models/Asset';

// Interface extending Express Request to include user attached by auth middleware
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const getAssets = async (req: Request, res: Response) => {
  try {
    const assets = await Asset.find({ isAvailable: true }).populate('owner', 'name email');
    return res.status(200).json(assets);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching assets', error });
  }
};

export const createAsset = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }

    const newAsset = await Asset.create({
      title,
      description,
      category: category || 'General',
      owner: req.user?.id,
    });

    return res.status(201).json(newAsset);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating asset', error });
  }
};