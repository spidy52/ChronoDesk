import { Server, Socket } from 'socket.io';
import BoardEvent from '../models/BoardEvent';
import User from '../models/User';

export default function setupBoardSocket(io: Server, socket: Socket) {
  
  // User joins a whiteboard room
  socket.on('board:join', async ({ boardId }) => {
    const userId = socket.data.userId;
    if (!boardId) return;

    socket.join(boardId);
    socket.data.boardId = boardId;

    // Fetch user details for presence info
    const user = await User.findById(userId).select('name email username avatar');
    const userProfile = {
      userId,
      name: user?.name || user?.username || 'Collaborator',
      avatar: user?.avatar || '',
      color: getRandomColor(userId), // Generates stable color per user
    };

    console.log(`User ${userId} (${userProfile.name}) joined board room ${boardId}`);

    // Notify others in room about new collaborator
    socket.to(boardId).emit('board:user-joined', userProfile);

    // List all users in room to return to the joiner
    const sockets = await io.in(boardId).fetchSockets();
    const activeUsers = [];
    for (const s of sockets) {
      if (s.data.userId && s.data.userId !== userId) {
        const u = await User.findById(s.data.userId).select('name email username avatar');
        activeUsers.push({
          userId: s.data.userId,
          name: u?.name || u?.username || 'Collaborator',
          avatar: u?.avatar || '',
          color: getRandomColor(s.data.userId),
        });
      }
    }

    socket.emit('board:joined', { activeUsers, selfProfile: userProfile });
  });

  // Relay Yjs update chunks (Uint8Array format)
  socket.on('yjs:update', (update: any) => {
    const boardId = socket.data.boardId;
    if (!boardId) return;
    
    // Relay binary update to all other room sockets
    socket.to(boardId).emit('yjs:update', update);
  });

  // Client requests document state from peers in the room
  socket.on('yjs:sync-step-1', (stateVector: any) => {
    const boardId = socket.data.boardId;
    const userId = socket.data.userId;
    if (!boardId || !userId) return;

    // Relay state vector request to other clients in room
    socket.to(boardId).emit('yjs:sync-step-1', {
      requestingUserId: userId,
      stateVector,
    });
  });

  // Peer responds with missing updates for the requester
  socket.on('yjs:sync-step-2', ({ targetUserId, update }: { targetUserId: string; update: any }) => {
    const boardId = socket.data.boardId;
    if (!boardId) return;

    // Direct relay back to the specific requesting client
    io.to(targetUserId).emit('yjs:sync-step-2', update);
  });


  // Zero-lag real-time cursor broadcast
  socket.on('cursor:move', (coords: { x: number; y: number }) => {
    const boardId = socket.data.boardId;
    const userId = socket.data.userId;
    if (!boardId || !userId) return;

    socket.to(boardId).emit('cursor:update', {
      userId,
      x: coords.x,
      y: coords.y,
    });
  });

  // Low-latency drawing-in-progress broadcast (transient mouse-move drawings)
  socket.on('draw:progress', (drawingData: { tool: string; color: string; width: number; points: number[] }) => {
    const boardId = socket.data.boardId;
    const userId = socket.data.userId;
    if (!boardId || !userId) return;

    socket.to(boardId).emit('draw:progress-update', {
      userId,
      ...drawingData,
    });
  });

  // Commit finalized canvas mutations (Creation, Update, Deletion of strokes/shapes) to MongoDB log
  socket.on('element:commit', async (payload: { type: string; timestamp: number; data: any }) => {
    const boardId = socket.data.boardId;
    const userId = socket.data.userId;
    if (!boardId || !userId) return;

    try {
      // Create persistent database entry
      const boardEvent = await BoardEvent.create({
        boardId,
        type: payload.type,
        timestamp: payload.timestamp || Date.now(),
        userId,
        data: payload.data,
      });

      // Broadcast finalized event to all clients to apply locally
      io.to(boardId).emit('element:commit-success', boardEvent);
    } catch (err) {
      console.error('Failed to commit whiteboard element event:', err);
      socket.emit('element:commit-error', { error: 'Failed to save element change' });
    }
  });

  // Clear whiteboard canvas
  socket.on('board:clear', async () => {
    const boardId = socket.data.boardId;
    const userId = socket.data.userId;
    if (!boardId || !userId) return;

    try {
      const clearEvent = await BoardEvent.create({
        boardId,
        type: 'CLEAR',
        timestamp: Date.now(),
        userId,
        data: {},
      });

      io.to(boardId).emit('board:clear-success', clearEvent);
    } catch (err) {
      console.error('Failed to clear board:', err);
    }
  });

  // Clean up user from rooms and broadcast leave event
  socket.on('board:leave', () => {
    handleLeave();
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    handleLeave();
  });

  function handleLeave() {
    const boardId = socket.data.boardId;
    const userId = socket.data.userId;
    if (!boardId || !userId) return;

    console.log(`User ${userId} left board room ${boardId}`);
    socket.to(boardId).emit('board:user-left', { userId });
    socket.leave(boardId);
    
    // Reset room bindings on socket
    socket.data.boardId = null;
  }
}

/**
 * Generate a consistent vibrant HSL color based on a string seed (e.g. user id)
 */
function getRandomColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 85%, 55%)`; // Vibrant colors for dark mode cursors
}
