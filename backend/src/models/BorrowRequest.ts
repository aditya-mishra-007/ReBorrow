// backend/src/models/BorrowRequest.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IBorrowRequest extends Document {
  asset: mongoose.Types.ObjectId;
  borrower: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

const BorrowRequestSchema: Schema = new Schema(
  {
    asset: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    borrower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'returned'],
      default: 'pending',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IBorrowRequest>('BorrowRequest', BorrowRequestSchema);