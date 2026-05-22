import mongoose from 'mongoose';

const boardSnapshotSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    timestamp: {
      type: Number,
      required: true,
      index: true,
    },
    snapshotUrl: {
      type: String,
      required: true, // File path or S3 key containing the compressed JSON string of elements
    },
  },
  {
    timestamps: true,
  }
);

boardSnapshotSchema.index({ boardId: 1, timestamp: 1 });

export default mongoose.model('BoardSnapshot', boardSnapshotSchema);
