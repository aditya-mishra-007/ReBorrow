import mongoose, { Document, Model, Schema, Types } from 'mongoose';

/**
 * AssetStatus
 * ------------------------------------------------------------------
 * Union type mirroring the schema-level enum. Centralizing this type
 * lets controllers/services import it for compile-time safety instead
 * of hardcoding string literals scattered across the codebase.
 */
export type AssetStatus = 'available' | 'requested' | 'borrowed';

/**
 * IAsset
 * ------------------------------------------------------------------
 * TypeScript interface describing the shape of an Asset document.
 *
 * NOTE: `name` is intentionally used (not `title`) to match the exact
 * field naming contract expected by frontend components, per project spec.
 */
export interface IAsset extends Document {
  name: string;
  description: string;
  category: string;
  status: AssetStatus;
  owner: Types.ObjectId;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AssetSchema
 * ------------------------------------------------------------------
 * Defines validation rules and relationships for the Asset collection.
 */
const AssetSchema: Schema<IAsset> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
      minlength: [2, 'Asset name must be at least 2 characters long'],
      maxlength: [100, 'Asset name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Asset description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Asset category is required'],
      trim: true,
      maxlength: [50, 'Category cannot exceed 50 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['available', 'requested', 'borrowed'],
        message: '{VALUE} is not a valid asset status',
      },
      default: 'available',
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Asset must be associated with an owner'],
    },
    // Stores full Cloudinary secure_url strings, not raw public_ids —
    // this keeps read paths simple (frontend renders images.map(url
    // => <img src={url} />) with zero URL construction logic needed).
    // Deletion still works fine since Cloudinary's public_id can be
    // parsed back out of the URL when needed (see deleteAsset in
    // assetController.ts).
    images: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // Automatically manages createdAt / updatedAt
  }
);

/**
 * Indexes
 * ------------------------------------------------------------------
 * - `owner` is indexed since we'll frequently query "all assets owned
 *   by user X" (e.g., a user's dashboard/profile listing).
 * - `status` is indexed since the primary browse/discovery view will
 *   filter heavily on 'available' assets.
 * - A compound text index on name/description/category supports basic
 *   search functionality without requiring a separate search service.
 */
AssetSchema.index({ owner: 1 });
AssetSchema.index({ status: 1 });
AssetSchema.index({ name: 'text', description: 'text', category: 'text' });

/**
 * Asset Model
 * ------------------------------------------------------------------
 * Exported as the default. Named `Asset` and mapped to the `assets`
 * collection in MongoDB by Mongoose's pluralization convention.
 */
const Asset: Model<IAsset> = mongoose.model<IAsset>('Asset', AssetSchema);

export default Asset;