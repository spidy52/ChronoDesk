import mongoose from 'mongoose';
import Task from '../models/Task';
import Board from '../models/Board';
import BoardEvent from '../models/BoardEvent';
import BoardSnapshot from '../models/BoardSnapshot';
import TimelineFrame from '../models/TimelineFrame';
import Message from '../models/Message';
import { encryptMessage } from '../utils/crypto';

export const cleanupOrphanWhiteboards = async () => {
  try {
    const boards = await Board.find({});
    let deletedCount = 0;

    for (const board of boards) {
      const taskExists = await Task.exists({ _id: board.taskId });
      if (!taskExists) {
        await Board.deleteOne({ _id: board._id });
        await BoardEvent.deleteMany({ boardId: board._id });
        await BoardSnapshot.deleteMany({ boardId: board._id });
        await TimelineFrame.deleteMany({ boardId: board._id });
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} orphan whiteboards and their events/snapshots from MongoDB.`);
    }
  } catch (err) {
    console.error('Failed to cleanup orphan whiteboards:', err);
  }
};

export const encryptExistingMessagesInDB = async () => {
  try {
    const unencryptedMessages = await Message.find({ content: { $not: /^enc:/ } });
    if (unencryptedMessages.length > 0) {
      console.log(`Encrypting ${unencryptedMessages.length} legacy plaintext chat messages in MongoDB...`);
      for (const m of unencryptedMessages) {
        if (m.content && !m.content.startsWith('enc:')) {
          m.content = encryptMessage(m.content);
          await m.save();
        }
      }
      console.log('Finished encrypting legacy chat messages in MongoDB.');
    }
  } catch (err) {
    console.error('Failed to encrypt existing chat messages:', err);
  }
};

export const connectDB = async () => {
  try {
    const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/chrono';
    await mongoose.connect(uri);
    console.log('MongoDB Connected via Mongoose');
    cleanupOrphanWhiteboards();
    encryptExistingMessagesInDB();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
