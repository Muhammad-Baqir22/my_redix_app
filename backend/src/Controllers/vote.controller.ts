import { Request, Response } from "express";
import prisma from '../db/prismaclient.js'
import { TypedResponse } from '../types/typedResponse.js';
import { ApiResponse } from "../ResponseModel/api.ResponseModel.js";
import {Vote} from '../ResponseModel/vote.ResponseModel.js'

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
            }
        } else {
            await prisma.postVote.create({
                data: {
                    user_id,
                    post_id,
                    vote_type
                }
            })
        }
        return res.status(200).json({ success: true, message: "Vote added successfully" })
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const commentVote = async (req: Request, res: TypedResponse<ApiResponse<Vote>>): Promise<any> => {
    const {  comment_id, vote_type } = req.body;
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
            return res.status(200).json({ success: true, message: "Vote added successfully" })
        }
    } catch (error: any) {
        return res.status(500).json({success:false, message: error.message })
    }
}