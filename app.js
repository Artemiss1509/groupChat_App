import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import userRouter from './routes/user.routes.js';
import conversationRouter from './routes/conversation.routes.js';
import messagesRouter from './routes/messages.routes.js';
import './models/user.model.js';
import './models/messages.model.js';
import './models/conversation.model.js';
import './models/messageReadStatus.model.js';
import './models/associations.js';
import db from "./utils/DB.connection.js";
import { socketIO } from './utils/socket-io.js';

const app = express();
const httpServer = createServer(app);

const io = socketIO(httpServer);

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



db.sync().then(() => {
  console.log('Database synced');
  httpServer.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
}).catch((error) => {
  console.error('Error syncing database:', error);
});