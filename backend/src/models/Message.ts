import mongoose from 'mongoose';
import { encryptMessage } from '../utils/crypto';

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.pre('save', function (this: any) {
  if (this.isModified('content') && this.content) {
    if (!this.content.startsWith('enc:')) {
      this.content = encryptMessage(this.content);
    }
  }
});

export default mongoose.model('Message', messageSchema);
