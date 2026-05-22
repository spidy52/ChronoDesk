import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import setupChatSocket from './chat.socket';
import setupPresenceSocket from './presence.socket';
import setupBoardSocket from './board.socket';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-chrono-key-change-me';

export const setupSocketHandlers = (io: Server) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      socket.data.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const userId = socket.data.userId;
    console.log('User connected via Socket.io:', userId);
    
    socket.join(userId);

    await User.findByIdAndUpdate(userId, { isOnline: true });
    
    io.emit('user:online', { userId });

    setupChatSocket(io, socket);
    setupPresenceSocket(io, socket);
    setupBoardSocket(io, socket);


    socket.on('disconnect', async () => {
      console.log('User disconnected:', userId);
      
      const sockets = await io.in(userId).fetchSockets();
      if (sockets.length === 0) {
        await User.findByIdAndUpdate(userId, { isOnline: false });
        io.emit('user:offline', { userId });
      }
    });
  });
};
