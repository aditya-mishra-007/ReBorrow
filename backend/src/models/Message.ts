import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IMessage extends Document {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  text: string;
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema<IMessage> = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },
    // Tracks which participants have read this message — starts with
    // just the sender (they've obviously "read" their own message).
    // Used to compute unread counts on the conversation list.
    readBy: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
  },
  { timestamps: true }
);

MessageSchema.index({ conversation: 1, createdAt: 1 });

const Message: Model<IMessage> = mongoose.model<IMessage>('Message', MessageSchema);

export default Message;