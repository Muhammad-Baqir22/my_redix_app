import { Request, Response } from "express";
import prisma from "../db/prismaclient";
import { Post } from "../ResponseModel/post.ResponseModel";
import { TypedResponse } from '../types/typedResponse';
import { ApiResponse } from "../ResponseModel/api.ResponseModel";

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

export const getallPostController = async (req: Request, res: TypedResponse<ApiResponse<Post[]>>): Promise<any> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.pageSize as string) || 10;
    const skip = (page - 1) * limit;
    const user_id = (req as any).user_id;
    try {
        const subredditfollow = await prisma.userSubs.findMany({
            where: {
                followed_by_id: user_id
            },
            select: {
                subs_id: true
            }
        })
        const userfollow = await prisma.userfollow.findMany({
            where:{
                followed_by_id:user_id
            },
            select:{
                user_id:true
            }
        })
        const subredditfollowid = subredditfollow.map((s : any) =>s.subs_id);
        const userfollowid = userfollow.map((u : any)=>u.user_id);
        const allpost = await prisma.post.findMany({
            where: {
                OR: [
                    { subreddit_id: { in: subredditfollowid } },
                    { user_id: { in: userfollowid } },
                ]
            },
            skip:skip,
            take:limit,
            orderBy:{
                created_at:'desc'
            },
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
        if (!allpost) {
            return res.status(404).json({ success: false, message: 'Post not found' })
        }
        const allpost_data = await Promise.all(allpost.map(async (post : any) => {
            const vote_post = await prisma.postVote.aggregate({
                where: { post_id: post.id },
                _sum: {
                    vote_type: true
                }
            });
            const comments = await prisma.comment.findMany({
                where: { post_id: post.id },
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
            });
            const root: any[] = [];
            for (const comment of comments) {
                const currentcomment = commentObj.get(comment.id);

                if (comment.parent_comment_id) {
                    const parentcomment = commentObj.get(comment.parent_comment_id);
                    if (parentcomment) {
                        parentcomment.replies.push(currentcomment);
                    }
                } else {
                    root.push(currentcomment)
                }
                const commentvote = await prisma.commentVote.aggregate({
                    where: { comment_id: comment.id },
                    _sum: {
                        vote_type: true
                    }
                })
                currentcomment.commentVote = commentvote._sum.vote_type || 0;

            }

            return {
                id: post.id,
                title: post.title,
                content: post.content,
                user_id: post.user_id,
                subreddit_id: post.subreddit_id,
                username: post.author.username,
                subreddit_name: post.subreddit?.name,
                votes: vote_post._sum.vote_type || 0,
                comment: root,
                media_url: post.media_url,
                created_at: post.created_at
            }
        }))
        return res.status(200).json({ success: true, message: 'Post found', data: allpost_data,pageNo:page,pageSize:limit })

    } catch (error: any) {
        return res.status(200).json({ success: false, message: 'Post not found', error: error.message });
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






