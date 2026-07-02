import { Request, Response } from "express";
import prisma from "../db/prismaclient";
import { Post } from "../ResponseModel/post.ResponseModel";
import { TypedResponse } from '../types/typedResponse';
import { ApiResponse } from "../ResponseModel/api.ResponseModel";

export const getpopularposts = async (req: Request, res: TypedResponse<ApiResponse<Post[]>>): Promise<any> => {
    const page  = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.pageSize as string) || 20;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24 hours

    try {
        const posts = await prisma.post.findMany({
            where: { created_at: { gte: since } },
            include: {
                author:    { select: { username: true } },
                subreddit: { select: { name: true } },
            },
        });

        const withVotes = await Promise.all(posts.map(async (post: any) => {
            const vote_post = await prisma.postVote.aggregate({
                where: { post_id: post.id },
                _sum: { vote_type: true },
            });
            const comments = await prisma.comment.findMany({ where: { post_id: post.id } });
            return {
                id: post.id,
                title: post.title,
                content: post.content,
                user_id: post.user_id,
                subreddit_id: post.subreddit_id,
                username: post.author.username,
                subreddit_name: post.subreddit?.name ?? null,
                votes: vote_post._sum.vote_type || 0,
                comment: comments,
                media_url: post.media_url,
                created_at: post.created_at,
            };
        }));

        // sort by votes descending, then paginate in JS
        withVotes.sort((a: any, b: any) => b.votes - a.votes);
        const paginated = withVotes.slice((page - 1) * limit, page * limit);

        return res.status(200).json({ success: true, message: "Popular posts", data: paginated, pageNo: page, pageSize: limit });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: "Failed", error: error.message });
    }
};

export const postController = async (req: Request, res: TypedResponse<ApiResponse<Post>>): Promise<any> => {
    const { title, content, id , media_url} = req.body;
    const userid = (req as any).user_id;
    try {
        const post = await prisma.post.create({
            data: {
                title,
                content,
                user_id: userid,
                subreddit_id: id && id.trim() !== "" ? id : null,
                media_url
            }
        });
        return res.status(200).json({ success: true, message: 'Post Ctreated', data: { title: post.title, content: post.content, user_id: post.user_id, subreddit_id: post.subreddit_id ,media_url: post.media_url} });
    } catch (error: any) {
        if (error.code === 'P2003') {
            return res.status(400).json({ success: false, message: 'Invalid subreddit_id: The subreddit does not exist.' });
        }
        return res.status(400).json({ success: false, message: 'Post not Ctreated', error: error.message })
    }
}

// shared helper — builds the full post object with votes + threaded comments
async function buildPostData(post: any) {
    const vote_post = await prisma.postVote.aggregate({
        where: { post_id: post.id },
        _sum: { vote_type: true },
    });
    const comments = await prisma.comment.findMany({
        where: { post_id: post.id },
        include: { author: { select: { username: true } } },
    });
    const commentObj = new Map<string, any>();
    comments.forEach((comment: any) => {
        commentObj.set(comment.id, {
            id: comment.id, content: comment.content, created_at: comment.created_at,
            parent_comment_id: comment.parent_comment_id, user_id: comment.user_id,
            post_id: comment.post_id, username: comment.author.username,
            replies: [], commentVote: 0,
        });
    });
    const root: any[] = [];
    for (const comment of comments) {
        const cur = commentObj.get(comment.id);
        if (comment.parent_comment_id) {
            const parent = commentObj.get(comment.parent_comment_id);
            if (parent) parent.replies.push(cur);
        } else {
            root.push(cur);
        }
        const cv = await prisma.commentVote.aggregate({
            where: { comment_id: comment.id }, _sum: { vote_type: true },
        });
        cur.commentVote = cv._sum.vote_type || 0;
    }
    return {
        id: post.id, title: post.title, content: post.content,
        user_id: post.user_id, subreddit_id: post.subreddit_id,
        username: post.author.username, subreddit_name: post.subreddit?.name ?? null,
        votes: vote_post._sum.vote_type || 0,
        comment: root, media_url: post.media_url, created_at: post.created_at,
    };
}

export const getallPostController = async (req: Request, res: TypedResponse<ApiResponse<Post[]>>): Promise<any> => {
    const page    = parseInt(req.query.page as string) || 1;
    const limit   = parseInt(req.query.pageSize as string) || 10;
    const skip    = (page - 1) * limit;
    const user_id = (req as any).user_id;

    try {
        const [subredditfollow, userfollow] = await Promise.all([
            prisma.userSubs.findMany({ where: { followed_by_id: user_id }, select: { subs_id: true } }),
            prisma.userfollow.findMany({ where: { followed_by_id: user_id }, select: { user_id: true } }),
        ]);

        const subredditfollowid = subredditfollow.map((s: any) => s.subs_id);
        const userfollowid      = userfollow.map((u: any) => u.user_id);
        const hasFollows        = subredditfollowid.length > 0 || userfollowid.length > 0;

        const include = {
            author:    { select: { username: true } },
            subreddit: { select: { name: true } },
        };

        let posts: any[];

        if (!hasFollows) {
            // no follows at all — return all posts newest first
            posts = await prisma.post.findMany({
                skip, take: limit,
                orderBy: { created_at: 'desc' },
                include,
            });
        } else {
            // fetch followed posts for this page
            const followedPosts = await prisma.post.findMany({
                where: {
                    OR: [
                        { subreddit_id: { in: subredditfollowid } },
                        { user_id:      { in: userfollowid      } },
                    ],
                },
                skip, take: limit,
                orderBy: { created_at: 'desc' },
                include,
            });

            // if followed posts fill the page, return them as-is
            if (followedPosts.length >= limit) {
                posts = followedPosts;
            } else {
                // fill remaining slots with non-followed posts (discovery)
                const followedIds    = followedPosts.map((p: any) => p.id);
                const followedUserIds   = [...userfollowid,      user_id]; // exclude self too
                const followedSubIds    = subredditfollowid;
                const remaining      = limit - followedPosts.length;

                const discoveryPosts = await prisma.post.findMany({
                    where: {
                        id:          { notIn: followedIds },
                        user_id:     { notIn: followedUserIds },
                        ...(followedSubIds.length > 0
                            ? { subreddit_id: { notIn: followedSubIds } }
                            : {}),
                    },
                    take: remaining,
                    orderBy: { created_at: 'desc' },
                    include,
                });

                posts = [...followedPosts, ...discoveryPosts];
            }
        }

        const allpost_data = await Promise.all(posts.map(buildPostData));
        return res.status(200).json({ success: true, message: 'Post found', data: allpost_data, pageNo: page, pageSize: limit });

    } catch (error: any) {
        return res.status(500).json({ success: false, message: 'Post not found', error: error.message });
    }
}

export const getuserpost = async (req: Request, res: TypedResponse<ApiResponse<Post[]>>): Promise<any> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.pagesize as string)|| 10;
    const offset = (page-1)*limit;
    const userid = (req as any).user_id;
    try {
        const userpost = await prisma.post.findMany({
            skip:offset,
            take:limit,
            orderBy:{
                created_at: 'desc',
            },
            where: { user_id: userid, subreddit_id: null },
            include: {
                author: {
                    select: {
                        username: true
                    }
                }
            }
        });

        if (!userpost) {
            return res.status(404).json({ success: false, message: "User post not found" })
        }

        const userpost_data = await Promise.all(userpost.map(async (post:any) => {
            const vote_post = await prisma.postVote.aggregate({
                where: { post_id: post.id },
                _sum: {
                    vote_type: true
                }
            });
            const comments = await prisma.comment.findMany({
                where: { post_id: post.id }, orderBy: { created_at: "asc" },
                include: {
                    author: {
                        select: {
                            username: true
                        }
                    }
                }
            });
            const commentObj = new Map<string, any>();
            comments.forEach((comment : any) => {
                commentObj.set(comment.id, {
                    id: comment.id,
                    content: comment.content,
                    created_at: comment.created_at,
                    parent_comment_id: comment.parent_comment_id,
                    user_id: comment.user_id,
                    post_id: comment.post_id,
                    username: comment.author.username,
                    replies: [],
                    commentVote: 0,
                });
            })
            const root: any[] = [];
            for (const comment of comments) {
                const currentcomment = commentObj.get(comment.id);
                if (comment.parent_comment_id) {
                    const parentcomment = commentObj.get(comment.parent_comment_id);
                    if (parentcomment) {
                        parentcomment.replies.push(currentcomment);

                    }

                } else {
                    root.push(currentcomment);
                }
                const comment_vote = await prisma.commentVote.aggregate({
                    where: { comment_id: comment.id },
                    _sum: {
                        vote_type: true
                    }
                })
                currentcomment.commentVote = comment_vote._sum.vote_type || 0;
            }
            return {
                id: post.id,
                title: post.title,
                content: post.content,
                user_id: post.user_id,
                subreddit_id: post.subreddit_id,
                username: post.author.username,
                votes: vote_post._sum.vote_type || 0,
                comment: root,
                media_url: post.media_url,
                created_at: post.created_at
            }
        }))
        return res.status(200).json({ success: true, message: "User post found", data: userpost_data,pageNo:page,pageSize:limit })
    } catch (error: any) {
        return res.status(400).json({ success: false, message: "User post not found", error: error })
    }
}

export const getpostbyusername = async (req: Request, res: TypedResponse<ApiResponse<Post[]>>): Promise<any> => {
    const { username } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.pageSize as string) || 20;
    const offset = (page - 1) * limit;
    try {
        const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const posts = await prisma.post.findMany({
            skip: offset, take: limit,
            orderBy: { created_at: 'desc' },
            where: { user_id: user.id },
            include: { author: { select: { username: true } } }
        });

        const data = await Promise.all(posts.map(async (post: any) => {
            const vote_post = await prisma.postVote.aggregate({
                where: { post_id: post.id }, _sum: { vote_type: true }
            });
            const comments = await prisma.comment.findMany({ where: { post_id: post.id } });
            return {
                id: post.id, title: post.title, content: post.content,
                user_id: post.user_id, subreddit_id: post.subreddit_id,
                username: post.author.username,
                votes: vote_post._sum.vote_type || 0,
                comment: comments,
                media_url: post.media_url, created_at: post.created_at
            };
        }));

        return res.status(200).json({ success: true, message: "Posts found", data, pageNo: page, pageSize: limit });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: "Failed", error: error.message });
    }
};

export const deletePost = async (req: Request, res: Response): Promise<any> => {
    const post_id = req.params.id;
    const user_id = (req as any).user_id;
    try {
        const post = await prisma.post.findUnique({
            where: { id: post_id },
            include: { subreddit: { select: { created_by: true } } },
        });
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        const isAuthor         = post.user_id === user_id;
        const isCommunityAdmin = post.subreddit?.created_by === user_id;
        if (!isAuthor && !isCommunityAdmin)
            return res.status(403).json({ success: false, message: "Not authorized" });

        const comments   = await prisma.comment.findMany({ where: { post_id }, select: { id: true } });
        const commentIds = comments.map((c: any) => c.id);
        if (commentIds.length > 0) {
            await prisma.comment.updateMany({ where: { post_id, parent_comment_id: { not: null } }, data: { parent_comment_id: null } });
            await prisma.commentVote.deleteMany({ where: { comment_id: { in: commentIds } } });
            await prisma.comment.deleteMany({ where: { post_id } });
        }
        await prisma.postVote.deleteMany({ where: { post_id } });
        await prisma.savedPost.deleteMany({ where: { post_id } });
        await prisma.post.delete({ where: { id: post_id } });

        return res.status(200).json({ success: true, message: "Post deleted" });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: "Failed to delete post", error: error.message });
    }
};

//COMPLETED
export const getpostbyid = async (req: Request, res: TypedResponse<ApiResponse<Post>>): Promise<any> => {
    const post_id = req.params.id;
    try {
        const post = await prisma.post.findUnique({
            where: { id: post_id },
            include: {
                author: {
                    select: {
                        username: true
                    }
                },
                subreddit: {
                    select: {
                        name: true
                    }
                }
            }
        })
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" })
        }
        const vote_post = await prisma.postVote.aggregate({
            where: { post_id: post_id },
            _sum: {
                vote_type: true
            }
        })
        const comments = await prisma.comment.findMany({
            where: { post_id }, orderBy: { created_at: "asc" },
            include: {
                author: {
                    select: {
                        username: true
                    }
                }
            }
        });
        const commentObj = new Map<string, any>();
        comments.forEach((comment : any) => {
            commentObj.set(comment.id, {
                id: comment.id,
                content: comment.content,
                created_at: comment.created_at,
                parent_comment_id: comment.parent_comment_id,
                user_id: comment.user_id,
                post_id: comment.post_id,
                username: comment.author.username,
                replies: [],
                commentVote: 0
            });
        })
        const root: any[] = [];
        for (const comment of comments) {
            const currentcomment = commentObj.get(comment.id);
            if (comment.parent_comment_id) {
                const parentcomment = commentObj.get(comment.parent_comment_id);
                if (parentcomment) {
                    parentcomment.replies.push(currentcomment);

                }

            } else {
                root.push(currentcomment);
            }
            const comment_vote = await prisma.commentVote.aggregate({
                where: { comment_id: comment.id },
                _sum: {
                    vote_type: true
                }
            })
            currentcomment.commentVote = comment_vote._sum.vote_type || 0;
        }

        return res.status(200).json({
            success: true, message: "Post found",
            data: {
                title: post.title, username: post.author.username, name: post.subreddit?.name ?? null, content: post.content,
                user_id: post.user_id, subreddit_id: post.subreddit_id, comment: root, votepost: vote_post._sum.vote_type, media_url: post.media_url,
                created_at: post.created_at,

            }
        });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: "Post not found" })
    }

}






