import { comment } from './comment.ResponseModel.js';
export interface Post {
  id?: string;
  title: string;
  username?: string | null;
  name?: string | null;
  content?: string | null;
  user_id: string;
  subreddit_id?: string | null;
  subreddit_name?: string | null;
  comment?: comment[] | null;
  votes?: number | null;
  votepost?: number | null;
  commentvote?: number | null;
  media_url?: string | null;
  created_at?: Date | string | null;
};
