import mongoose, { Document, Model, Schema, Types } from 'mongoose';

/**
 * BorrowRequestStatus
 * ------------------------------------------------------------------
 * Union type mirroring the schema-level enum. Centralized here so
 * controllers/services can reference it for compile-time safety.
 */
export type BorrowRequestStatus = 'pending' | 'approved' | 'rejected';

/**
 * IBorrowRequest
 * ------------------------------------------------------------------
 * TypeScript interface describing the shape of a BorrowRequest document.
 */
export interface IBorrowRequest extends Document {
  asset: Types.ObjectId;
  requester: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: BorrowRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * BorrowRequestSchema
 * ------------------------------------------------------------------
 * Defines validation rules and relationships for the BorrowRequest
 * collection. This model represents a single request from a user
 * (`requester`) to borrow a specific `asset` for a given date range.
 */
const BorrowRequestSchema: Schema<IBorrowRequest> = new Schema(
  {
    asset: {
      type: Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'A borrow request must reference an asset'],
    },
    requester: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A borrow request must reference a requester'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        // Ensures the borrowing window is logically valid at the
        // document level, independent of any controller-level checks.
        validator: function (this: IBorrowRequest, value: Date): boolean {
          return value > this.startDate;
        },
        message: 'End date must be after the start date',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: '{VALUE} is not a valid borrow request status',
      },
      default: 'pending',
    },
  },
  {
    timestamps: true, // Automatically manages createdAt / updatedAt
  }
);

/**
 * Indexes
 * ------------------------------------------------------------------
 * - `asset` is indexed for fast lookups of "all requests for this asset"
 *   (used when validating overlapping requests or displaying request
 *   history on an asset's detail page).
 * - `requester` is indexed for fast lookups of "all requests made by
 *   this user" (used for a user's "My Borrow Requests" dashboard).
 * - Compound index on (asset, status) accelerates the most common
 *   query in the approval workflow: "does this asset already have a
 *   pending request?"
 */
BorrowRequestSchema.index({ asset: 1 });
BorrowRequestSchema.index({ requester: 1 });
BorrowRequestSchema.index({ asset: 1, status: 1 });

/**
 * BorrowRequest Model
 * ------------------------------------------------------------------
 * Exported as the default. Named `BorrowRequest` and mapped to the
 * `borrowrequests` collection in MongoDB by Mongoose's pluralization
 * convention.
 */
const BorrowRequest: Model<IBorrowRequest> = mongoose.model<IBorrowRequest>(
  'BorrowRequest',
  BorrowRequestSchema
);

export default BorrowRequest;