export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pageNo?: number;
  pageSize?: number;
}

/** Comment from the backend (threaded) */
export interface BackendComment {
  id: string;
  content: string;
  created_at: string;
  parent_comment_id: string | null;
  user_id: string;
  post_id: string;
  username: string;
  replies: BackendComment[];
  commentVote: number;
}

/** Post as returned by GET /api/post/ (feed) and GET /api/post/user */
export interface FeedPost {
  id: string;
  title: string;
  content: string | null;
  user_id: string;
  subreddit_id: string | null;
  username: string;
  subreddit_name?: string;
  votes: number;
  comment: BackendComment[];
  media_url: string | null;
  created_at?: string;
}

/** Post as returned by GET /api/post/post/:id */
export interface PostDetail {
  title: string;
  username: string;
  name: string | null;
  content: string | null;
  user_id: string;
  subreddit_id: string | null;
  comment: BackendComment[];
  votepost: number | null;
  media_url: string | null;
}

/** Subreddit as returned by GET /api/subreddit/subs/ */
export interface ApiSubreddit {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
}

/** Entry from GET /api/subreddit/followsub */
export interface ApiFollowEntry {
  followed_by_id: string;
  subs_id: string;
}
