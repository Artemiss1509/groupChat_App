import express from 'express';
import cors from 'cors'
import userRouter from './routes/user.routes.js'
import db from "./utils/DB.connection.js";

const app = express()
app.use(express.json());
app.use(cors())

app.use('/user',userRouter);






db.sync({force:true}).then(() => {
  console.log('Database synced');
  app.listen(3000, () => {
    console.log('Server is running on port 3000');
    });
}).catch((error) => {
  console.error('Error syncing database:', error);
})