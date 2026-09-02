import express from 'express';

import userRouter from './routes/user.routes'; 
import authRouter from './routes/auth.router'; 
import post from './routes/post.router'
import subreddit from './routes/subreddit.router';
import commentRouter from './routes/comment.router';
import voteRouter from './routes/vote.router';
import notificationRouter from './routes/notification.router';
import uploadRouter from './routes/upload.router';
import chatRoutes from "./routes/chat.router";
import savedpostRouter from "./routes/savedpost.router";
import './mqtt/mqttClient'
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use((req: any, res: any, next: any) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});
app.use(express.json());

app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/post',post);
app.use('/api/subreddit',subreddit);
app.use('/api/comment',commentRouter);
app.use('/api/vote',voteRouter);
app.use('/api/notification',notificationRouter);
app.use('/api/upload',uploadRouter);
app.use('/api/chat', chatRoutes);
app.use('/api/saved', savedpostRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
