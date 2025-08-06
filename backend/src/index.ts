import express from 'express';

import userRouter from './routes/user.routes'; 
import authRouter from './routes/auth.router'; 
import post from './routes/post.router'
import subreddit from './routes/subreddit.router';
import commentRouter from './routes/comment.router';
import voteRouter from './routes/vote.router';
import notificationRouter from './routes/notification.router';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true ,
  exposedHeaders: ['Authorization'],
}));
app.use(express.json());

app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/post',post);
app.use('/api/subreddit',subreddit);
app.use('/api/comment',commentRouter);
app.use('/api/vote',voteRouter);
app.use('/api/notification',notificationRouter);


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
