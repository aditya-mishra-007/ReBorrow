import mongoose, { Document, Model, Schema, Types } from 'mongoose';

/**
 * IConversation
 * ------------------------------------------------------------------
 * Represents a chat thread between exactly two users. Optionally
 * linked to an Asset, since the primary real-world use case is "I
 * want to ask the owner about this item" — but the schema doesn't
 * strictly require an asset, allowing for a general conversation
 * between two users if that's ever needed.
 *
 * `participants` is always stored as a sorted pair (see the pre-save
 * hook below) so a unique compound index can reliably prevent
 * duplicate conversations between the same two users for the same
 * asset, regardless of which user initiated it.
 */
export interface IConversation extends Document {
  participants: Types.ObjectId[]; // always exactly 2, sorted by ObjectId string value
  asset?: Types.ObjectId;
  lastMessageAt: Date;
  lastMessageText?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema<IConversation> = new Schema(
  {
    participants: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      required: true,
      validate: {
        validator: (value: Types.ObjectId[]) => value.length === 2,
        message: 'A conversation must have exactly 2 participants',
      },
    },
    asset: {
      type: Schema.Types.ObjectId,
      ref: 'Asset',
      required: false,
    },
    // Denormalized fields for fast conversation-list rendering without
    // needing to look up the latest Message document on every list
    // fetch — updated by messageController.ts whenever a new message
    // is sent in this conversation.
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    lastMessageText: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

/**
 * Pre-save hook: keep participants sorted
 * ------------------------------------------------------------------
 * Sorting by string representation ensures [userA, userB] and
 * [userB, userA] are always stored identically, regardless of who
 * initiated the conversation — this is what makes the unique index
 * below actually work as a duplicate-prevention mechanism.
 */
ConversationSchema.pre<IConversation>('save', function (next) {
  if (this.isModified('participants')) {
    this.participants.sort((a, b) => a.toString().localeCompare(b.toString()));
  }
  next();
});

// Prevents duplicate conversations for the same pair of users about
// the same asset. Note: `asset` can be undefined/null for a
// non-asset-specific conversation — Mongoose's sparse-like behavior
// with compound unique indexes on optional fields is a known nuance,
// but acceptable here since our primary flow always attaches an asset.
ConversationSchema.index({ participants: 1, asset: 1 }, { unique: true });

const Conversation: Model<IConversation> = mongoose.model<IConversation>(
  'Conversation',
  ConversationSchema
);

export default Conversation;