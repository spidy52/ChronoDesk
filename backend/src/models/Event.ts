import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  type: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  workspaceId: { type: mongoose.Schema.Types.ObjectId }
});

export const Event = mongoose.model('Event', eventSchema);
