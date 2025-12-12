import { Server } from 'socket.io';

export const socketIO = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: "http://127.0.0.1:5500",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

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
    return io;
}