import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import userRouter from './routes/user.routes.js';
import conversationRouter from './routes/conversation.routes.js';
import messagesRouter from './routes/messages.routes.js';
import './models/user.model.js';
import './models/messages.model.js';
import './models/conversation.model.js';
import './models/associations.js';
import db from "./utils/DB.connection.js";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://127.0.0.1:5500",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(
  cors({
    origin: "http://127.0.0.1:5500",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

app.set('io', io);

app.use('/user', userRouter);
app.use('/conversation', conversationRouter);
app.use('/messages', messagesRouter);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
    socket.token = token;
    next();
  } else {
    next(new Error('Authentication error'));
  }
});


io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  
  socket.on('join-conversation', (conversationId) => {
    socket.join(`conversation-${conversationId}`);
    console.log(`Socket ${socket.id} joined conversation-${conversationId}`);
  });

  
  socket.on('leave-conversation', (conversationId) => {
    socket.leave(`conversation-${conversationId}`);
    console.log(`Socket ${socket.id} left conversation-${conversationId}`);
  });

  
  socket.on('typing', ({ conversationId, userName }) => {
    socket.to(`conversation-${conversationId}`).emit('user-typing', userName);
  });

  socket.on('stop-typing', ({ conversationId }) => {
    socket.to(`conversation-${conversationId}`).emit('user-stop-typing');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

db.sync().then(() => {
  console.log('Database synced');
  httpServer.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
}).catch((error) => {
  console.error('Error syncing database:', error);
});