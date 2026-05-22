import mongoose from 'mongoose';

const boardEventSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true, // e.g. "CREATE_ELEMENT", "UPDATE_ELEMENT", "DELETE_ELEMENT", "CLEAR"
    },
    timestamp: {
      type: Number,
      required: true,
      index: true, // Used for quick slicing when seeking in timeline
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true, // Element details or updated attributes
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast queries: finding all events for a board after a snapshot's time up to selected seek time
boardEventSchema.index({ boardId: 1, timestamp: 1 });

export default mongoose.model('BoardEvent', boardEventSchema);
