import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import userRouter from './routes/user.routes.js';
import conversationRouter from './routes/conversation.routes.js';
import messagesRouter from './routes/messages.routes.js';
import './models/user.model.js';
import './models/messages.model.js';
import './models/conversation.model.js';
import './models/associations.js';
import db from "./utils/DB.connection.js";
import jwt from 'jsonwebtoken';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Map();

app.use(
    cors({
        origin: "http://127.0.0.1:5500",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    })
);

app.use(express.json());

app.use('/user', userRouter);
app.use('/conversation', conversationRouter);
app.use('/messages', messagesRouter);

wss.on('connection', (ws, request) => {
    console.log('New WebSocket connection');

    let userId = null;

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());

            if (message.type === 'auth') {
                const token = message.token;
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                    userId = decoded.id;
                    clients.set(userId, ws);
                    console.log(`User ${userId} authenticated via WebSocket`);
                    ws.send(JSON.stringify({ type: 'auth', status: 'success' }));
                } catch (error) {
                    ws.send(JSON.stringify({ type: 'auth', status: 'error', message: 'Invalid token' }));
                }
            }

            if (message.type === 'new_message') {
                const { conversationId, senderId, receiverId, content, messageData } = message;

                const receiverWs = clients.get(receiverId);
                if (receiverWs && receiverWs.readyState === ws.OPEN) {
                    receiverWs.send(JSON.stringify({
                        type: 'new_message',
                        data: messageData
                    }));
                }
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    });

    ws.on('close', () => {
        if (userId) {
            clients.delete(userId);
            console.log(`User ${userId} disconnected`);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

db.sync({ alter: true }).then(() => {
    console.log('Database synced');
    server.listen(3000, () => {
        console.log('Server is running on port 3000');
        console.log('WebSocket server is ready');
    });
}).catch((error) => {
    console.error('Error syncing database:', error);
});