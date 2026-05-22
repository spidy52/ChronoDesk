import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';

import { Server } from 'socket.io';
import { setupSocketHandlers } from './socket';
import routes from './routes';

import { connectDB } from './config/db';

import { errorHandler, notFound } from './middleware/error.middleware';

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
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

/* ================= ROUTES ================= */


app.use('/api', routes);

/* ================= ERROR HANDLING ================= */

app.use(notFound);

app.use(errorHandler);

/* ================= SOCKET EVENTS ================= */

setupSocketHandlers(io);

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});