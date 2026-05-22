import mongoose from 'mongoose';

const eventSchema =
  new mongoose.Schema(
    {
      title: {
        type: String,
        required: true,
      },

      description: {
        type: String,
        default: '',
      },

      date: {
        type: Date,
        required: true,
      },

      startTime: {
        type: String,
      },

      endTime: {
        type: String,
      },

      type: {
        type: String,
        default: 'Meeting',
      },

      meetingLink: {
        type: String,
      },

      workspaceId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: 'Workspace',
      },

      createdBy: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: 'User',
      },

      attendees: [
        {
          type:
            mongoose.Schema.Types
              .ObjectId,

          ref: 'User',
        },
      ],
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  'Event',
  eventSchema
);