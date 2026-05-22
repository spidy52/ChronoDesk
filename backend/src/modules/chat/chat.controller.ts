import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import Chat from '../../models/Chat';
import Message from '../../models/Message';
import User from '../../models/User';

export const getChats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const chats = await Chat.find({ participants: userId })
      .populate('participants', 'name username email avatar isOnline')
      .sort({ updatedAt: -1 });

    const formattedChats = chats.map((chat) => {
      const chatObj: any = chat.toObject();
      const counts = chatObj.unreadCounts;
      chatObj.unreadCount = counts instanceof Map ? counts.get(userId) : counts?.[userId!] || 0;
      delete chatObj.unreadCounts;
      return chatObj;
    });

    res.json({ success: true, chats: formattedChats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const createChatWithUser = async (req: AuthRequest, res: Response) => {
  try {
    const { otherUserName } = req.body;
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const otherUser = await User.findOne({ username: otherUserName.toLowerCase() });
    if (!otherUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (otherUser._id.toString() === userId) {
      return res.status(400).json({ success: false, error: 'Cannot chat with yourself' });
    }

    let chat: any = await Chat.findOne({
      participants: { $all: [userId, otherUser._id] },
    }).populate('participants', 'name username email avatar isOnline');

    if (!chat) {
      chat = await Chat.create({
        participants: [userId, otherUser._id],
        unreadCounts: { [userId]: 0, [otherUser._id.toString()]: 0 },
      });
      chat = await chat.populate('participants', 'name username email avatar isOnline');
    }

    const chatObj: any = chat.toObject();
    const counts = chatObj.unreadCounts;
    chatObj.unreadCount = counts instanceof Map ? counts.get(userId) : counts?.[userId] || 0;
    delete chatObj.unreadCounts;

    res.json({ success: true, chat: chatObj });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const deleteChat = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.userId;

    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    await Chat.deleteOne({ _id: chatId });
    await Message.deleteMany({ chatId });

    res.json({ success: true, message: 'Chat deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.json({ success: false, error: 'Username required' });
    }
    
    const users = await User.find({
      $or: [
        { username: { $regex: username, $options: 'i' } },
        { name: { $regex: username, $options: 'i' } },
      ],
      _id: { $ne: req.user?.userId }
    }).select('name username email avatar');

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
