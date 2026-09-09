import mongoose from 'mongoose';
import User from '../models/User';
import Workspace from '../models/Workspace';
import Task from '../models/Task';
import Board from '../models/Board';
import BoardEvent from '../models/BoardEvent';
import BoardSnapshot from '../models/BoardSnapshot';
import TimelineFrame from '../models/TimelineFrame';
import Message from '../models/Message';
import Chat from '../models/Chat';
import Event from '../models/Event';
import Member from '../models/Member';
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

export const cleanupOrphanUserData = async () => {
  try {
    const existingUsers = await User.find({}, '_id');
    const validUserIds = existingUsers.map((u) => u._id);

    // 1. Delete orphan workspaces (where owner no longer exists in User collection)
    const orphanWorkspaces = await Workspace.find({ owner: { $nin: validUserIds } });
    for (const ws of orphanWorkspaces) {
      const wsTasks = await Task.find({ workspaceId: String(ws._id) });
      for (const t of wsTasks) {
        const board = await Board.findOneAndDelete({ taskId: t._id });
        if (board) {
          await BoardEvent.deleteMany({ boardId: board._id });
          await BoardSnapshot.deleteMany({ boardId: board._id });
          await TimelineFrame.deleteMany({ boardId: board._id });
        }
      }
      await Task.deleteMany({ workspaceId: String(ws._id) });
      await Workspace.deleteOne({ _id: ws._id });
    }

    // 2. Delete orphan tasks (where createdBy no longer exists in User collection)
    const orphanTasks = await Task.find({ createdBy: { $nin: validUserIds } });
    for (const t of orphanTasks) {
      const board = await Board.findOneAndDelete({ taskId: t._id });
      if (board) {
        await BoardEvent.deleteMany({ boardId: board._id });
        await BoardSnapshot.deleteMany({ boardId: board._id });
        await TimelineFrame.deleteMany({ boardId: board._id });
      }
      await Task.deleteOne({ _id: t._id });
    }

    // 3. Delete orphan calendar events
    await Event.deleteMany({ user: { $nin: validUserIds } });

    // 4. Delete orphan member/invitation requests
    await Member.deleteMany({
      $or: [
        { fromUser: { $nin: validUserIds } },
        { toUser: { $nin: validUserIds } }
      ]
    });

    // 5. Cleanup deleted user references from workspace members & task collaborators
    await Workspace.updateMany(
      {},
      { $pull: { members: { $nin: validUserIds } } }
    );

    await Task.updateMany(
      {},
      {
        $pull: {
          collaborators: { $nin: validUserIds },
          pendingCollaborators: { $nin: validUserIds }
        }
      }
    );

    // 6. Delete empty or orphan chats and their messages
    const orphanChats = await Chat.find({
      $or: [
        { participants: { $size: 0 } },
        { participants: { $not: { $elemMatch: { $in: validUserIds } } } }
      ]
    });
    for (const chat of orphanChats) {
      await Message.deleteMany({ chatId: chat._id });
      await Chat.deleteOne({ _id: chat._id });
    }

    // 7. Clean up any orphan boards left behind
    await cleanupOrphanWhiteboards();

    console.log('Orphan user data and workspace integrity check completed.');
  } catch (err) {
    console.error('Failed to run orphan user data cleanup:', err);
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
    cleanupOrphanUserData();
    encryptExistingMessagesInDB();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
