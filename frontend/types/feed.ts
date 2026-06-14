export interface Post {
  id: string;
  community: string;
  communityInitial: string;
  communityColor: string;
  author: string;
  timeAgo: string;
  votes: number;
  title: string;
  content?: string;
  hasImage: boolean;
  imageGradient?: string;
  commentCount: number;
  isRecommended?: boolean;
}

export interface Community {
  name: string;
  initial: string;
  color: string;
  members: string;
  isTrending?: boolean;
}
