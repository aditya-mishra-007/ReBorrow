// backend/src/models/Asset.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IAsset extends Document {
  title: string;
  description: string;
  category: string;
  isAvailable: boolean;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
}

const AssetSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, default: 'General' },
    isAvailable: { type: Boolean, default: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IAsset>('Asset', AssetSchema);