import mongoose from 'mongoose';

const timelineFrameSchema = new mongoose.Schema(
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
    thumbnailUrl: {
      type: String,
      required: true, // File path or S3 key of the compressed 160x90 WEBP thumbnail
    },
  },
  {
    timestamps: true,
  }
);

timelineFrameSchema.index({ boardId: 1, timestamp: 1 });

export default mongoose.model('TimelineFrame', timelineFrameSchema);
