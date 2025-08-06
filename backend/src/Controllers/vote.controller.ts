import { Request, Response } from "express";
import prisma from '../db/prismaclient'
import { TypedResponse } from '../types/typedResponse';
import { ApiResponse } from "../ResponseModel/api.ResponseModel";
import { Vote } from '../ResponseModel/vote.ResponseModel'
import admin from '../firebase'

export const votePost = async (req: Request, res: TypedResponse<ApiResponse<Vote>>): Promise<any> => {
    const { vote_type, post_id } = req.body;
    const user_id = (req as any).user_id;
    try {
        const existingVote = await prisma.postVote.findUnique({
            where: {
                user_id_post_id: {
                    user_id,
                    post_id
                }
            }
        })
        if (existingVote) {
            if (vote_type === 0) {
                await prisma.postVote.delete({
                    where: {
                        user_id_post_id: {
                            user_id,
                            post_id
                        }
                    }
                })
                return res.status(200).json({ success: true, message: "Vote delete successfully" })
            }
            else {
                await prisma.postVote.update({
                    where: {
                        user_id_post_id: {
                            user_id,
                            post_id
                        }
                    },
                    data: {
                        vote_type,
                    }
                })
                return res.status(200).json({ success: true, message: "Vote updated successfully" })
            }
        } else {
            await prisma.postVote.create({
                data: {
                    user_id,
                    post_id,
                    vote_type
                }
            })
            if (vote_type === 1) {
                const userfcmtoken = await prisma.post.findUnique({
                    where: {
                        id: post_id
                    },
                    include: {
                        author: {
                            select: {
                                id: true,
                                fcm_token: true
                            }
                        }
                    }
                });
                const voteduser = await prisma.user.findUnique({
                    where: {
                        id: user_id
                    }
                })
                if (userfcmtoken?.author.fcm_token) {
                    const message = {
                        notification: {
                            title: "New Upvote",
                            body: `${voteduser?.username} upvoted your post`
                        },
                        token: userfcmtoken.author.fcm_token
                    }
                    try {
                        await admin.messaging().send(message);
                        res.status(200).json({ success: true, message: "Notification successfully send" })
                    } catch (error: any) {
                        res.status(505).json({ success: false, message: error })
                    }
                    await prisma.notification.create({
                        data: {
                            user_id: userfcmtoken.author.id,
                            type: 'like',
                            message: `${voteduser?.username} Liked your Post`,
                            Read: false
                        }
                    })
                }
            }
        }
        return res.status(200).json({ success: true, message: "Vote added successfully" })
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const commentVote = async (req: Request, res: TypedResponse<ApiResponse<Vote>>): Promise<any> => {
    const { comment_id, vote_type } = req.body;
    const user_id = (req as any).user_id;
    try {
        const comment = await prisma.comment.findUnique({
            where: {
                id: comment_id
            }
        })
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found" })
        }
        const excisting_vote = await prisma.commentVote.findUnique({
            where: {
                user_id_comment_id: {
                    user_id,
                    comment_id
                }
            }
        })
        if (excisting_vote) {
            if (vote_type === 0) {
                await prisma.commentVote.delete({
                    where: {
                        user_id_comment_id: {
                            user_id,
                            comment_id
                        }
                    }
                })
                return res.status(200).json({ success: true, message: "Vote removed successfully" })
            } else {
                await prisma.commentVote.update({
                    where: {
                        user_id_comment_id: {
                            user_id,
                            comment_id
                        }
                    },
                    data: {
                        vote_type: vote_type
                    }
                })
                return res.status(200).json({ success: true, message: "Vote updated successfully" })
            }

        } else {
            await prisma.commentVote.create({
                data: {
                    user_id,
                    comment_id,
                    vote_type
                }
            })
            if (vote_type === 1) {
                const uservoteid = await prisma.comment.findUnique({
                    where: {
                        id: comment_id
                    },
                    include: {
                        author: {
                            select: {
                                id: true,
                                fcm_token: true
                            }
                        }
                    }
                })
                const user = await prisma.user.findUnique({
                    where: {
                        id: user_id
                    }
                })
                if (uservoteid?.author.fcm_token) {
                    const message = {
                        notification: {
                            title: "New vote on your comment",
                            body: `${user?.username} voted on your comment`,
                        },
                        token: uservoteid.author.fcm_token
                    }
                    try {
                        await admin.messaging().send(message)
                        console.log('Message sent successfully');
                    } catch (error: any) {
                        res.status(500).json({ success: false, message: "Failed to send notification" })
                    }
                    await prisma.notification.create({
                        data: {
                            user_id: uservoteid.author.id,
                            type: 'like',
                            message: `${user?.username} like your comment`,
                            Read: false
                        }
                    })
                }
            }
            return res.status(200).json({ success: true, message: "Vote added successfully" })
        }
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message })
    }
}