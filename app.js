import express from 'express';
import cors from 'cors'
import userRouter from './routes/user.routes.js'
import conversationRouter from './routes/conversation.routes.js';
import messagesRouter from './routes/messages.routes.js';
import './models/user.model.js';
import './models/messages.model.js';
import './models/conversation.model.js';
import './models/associations.js';
import db from "./utils/DB.connection.js";

const app = express()

app.use(
  cors({
    origin: "http://127.0.0.1:5500", // or whatever host/port you open chatPage.html from
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

app.use('/user',userRouter);
app.use('/conversation', conversationRouter);
app.use('/messages', messagesRouter);

db.sync({alter:true}).then(() => {
  console.log('Database synced');
  app.listen(3000, () => {
    console.log('Server is running on port 3000');
    });
}).catch((error) => {
  console.error('Error syncing database:', error);
})