import mongoose, { Document, Schema } from 'mongoose';

export interface IAsset extends Document {
  title: string;
  description: string;
  category: 'Electronics' | 'Tools' | 'Books' | 'Sports' | 'Other';
  isAvailable: boolean;
  owner: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
}

const assetSchema: Schema<IAsset> = new mongoose.Schema({
  title: { type: String, required: [true, 'Please add an asset title'], trim: true },
  description: { type: String, required: [true, 'Please add a description'] },
  category: { 
    type: String, 
    required: [true, 'Please add a category'], 
    enum: ['Electronics', 'Tools', 'Books', 'Sports', 'Other'] 
  },
  isAvailable: { type: Boolean, default: true },
  owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IAsset>('Asset', assetSchema);