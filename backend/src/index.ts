import express from 'express';

import userRouter from './routes/user.routes.js'; 
import authRouter from './routes/auth.router.js'; 
import post from './routes/post.router.js'
import subreddit from './routes/subreddit.router.js';
import commentRouter from './routes/comment.router.js';
import voteRouter from './routes/vote.router.js';
import notificationRouter from './routes/notification.router.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;


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
