import mongoose from 'mongoose';

const membersSchema =
  new mongoose.Schema(
    {
      fromUser: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },

      toUser: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },

      role: {
        type: String,
        default: 'Member',
      },

      status: {
        type: String,

        enum: [
          'pending',
          'accepted',
          'rejected',
        ],

        default: 'pending',
      },
    },

    {
      timestamps: true,
    }
  );

export default mongoose.model(
  'Members',
  membersSchema
);