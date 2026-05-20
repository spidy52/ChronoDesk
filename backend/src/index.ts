import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';

import { Server } from 'socket.io';

import routes from './routes';

import { connectDB } from './config/db';

dotenv.config();

const app = express();

const server = http.createServer(app);

/* ================= DATABASE ================= */

connectDB();

/* ================= SOCKET ================= */

export const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
});

/* ================= MIDDLEWARE ================= */

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());

/* ================= ROUTES ================= */

app.use('/api', routes);

/* ================= SOCKET EVENTS ================= */

io.on('connection', (socket) => {
  console.log(
    'User connected:',
    socket.id
  );

  socket.on('disconnect', () => {
    console.log(
      'User disconnected:',
      socket.id
    );
  });
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});