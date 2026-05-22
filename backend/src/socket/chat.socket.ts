import { Server, Socket } from 'socket.io';
import Chat from '../models/Chat';
import Message from '../models/Message';

export default function setupChatSocket(io: Server, socket: Socket) {
  socket.on('message:send', async (data, callback) => {
    try {
      const { chatId, senderId, content } = data;
      
      const chat = await Chat.findById(chatId);
      if (!chat) {
        if (callback) callback({ success: false, error: 'Chat not found' });
        return;
      }
      
      const message = await Message.create({
        chatId,
        senderId,
        content,
      });
      
      chat.lastMessage = {
        content,
        senderId,
        createdAt: message.createdAt,
        readAt: null,
        deliveredAt: null,
      } as any;
      
      const otherParticipants = chat.participants.filter((p: any) => p.toString() !== senderId);
      for (const p of otherParticipants) {
        const idStr = p.toString();
        const currentCount = chat.unreadCounts?.get(idStr) || 0;
        chat.unreadCounts?.set(idStr, currentCount + 1);
      }
      
      await chat.save();
      
      for (const p of otherParticipants) {
        io.to(p.toString()).emit('message:received', message);
      }
      
      if (callback) callback({ success: true, message });
    } catch (error) {
      console.error('Socket message:send error:', error);
      if (callback) callback({ success: false, error: 'Failed to send message' });
    }
  });

  socket.on('chat:read', async (data) => {
    try {
      const { chatId } = data;
      const userId = socket.data.userId;
      
      const chat = await Chat.findById(chatId);
      if (chat && chat.unreadCounts?.has(userId)) {
        chat.unreadCounts.set(userId, 0);
        await chat.save();
      }
      
    } catch (error) {
      console.error('Socket chat:read error:', error);
    }
  });
}
