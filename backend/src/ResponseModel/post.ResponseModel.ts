import { comment } from './comment.ResponseModel.js';
export interface Post {
  title: string;
  username?: String | null,
  name?: String | null,
  content?: string | null;
  user_id: string;
  subreddit_id?: string | null;
  comment?: comment[] | null;
  votepost?: number|null;
  commentvote?:number|null
};
