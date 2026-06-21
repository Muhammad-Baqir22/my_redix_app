import { Request, Response } from "express";
import prisma from "../db/prismaclient";
import { TypedResponse } from '../types/typedResponse';
import { ApiResponse } from "../ResponseModel/api.ResponseModel";
import { comment } from "../ResponseModel/comment.ResponseModel";
import admin from "../firebase";


export const postcomment = async (req: Request, res: TypedResponse<ApiResponse<comment>>): Promise<any> => {
    const { content, post_id, parent_id } = req.body;
    const user_id = (req as any).user_id;
    const check_post = await prisma.post.findUnique({ where: { id: post_id } })
    if (!check_post) {
        return res.status(404).json({ success: false, message: "Post not found" })
    }
    try {
        const comment = await prisma.comment.create({
            data: {
                content,
                user_id,
                post_id,
                parent_comment_id: parent_id && parent_id !== "" ? parent_id : null
            }
        });
        const [postWithAuthor, commenter] = await Promise.all([
            prisma.post.findUnique({
                where: { id: post_id },
                include: { author: { select: { id: true, username: true, fcm_token: true } } },
            }),
            prisma.user.findUnique({ where: { id: user_id }, select: { username: true } }),
        ]);

        // Notify post author (unless they commented on their own post)
        if (postWithAuthor && postWithAuthor.author.id !== user_id) {
            await prisma.notification.create({
                data: {
                    user_id: postWithAuthor.author.id,
                    type: "comment",
                    message: `u/${commenter?.username ?? "Someone"} commented on your post`,
                    Read: false,
                },
            });

            if (postWithAuthor.author.fcm_token) {
                try {
                    await admin.messaging().send({
                        notification: { title: "New Comment on your Post", body: `${commenter?.username} commented on your post: ${content}` },
                        token: postWithAuthor.author.fcm_token,
                    });
                } catch { /* ignore FCM errors */ }
            }
        }
        return res.status(201).json({ success: true, message: "Comment created successfully", data: comment });
    } catch (error: any) {
        if (error.code == 'P2003') {
            return res.status(400).json({ success: false, message: "Parent id is not correct" })
        }
        return res.status(500).json({ success: false, message: error.message })
    }
}


export const getcomments = async (req: Request, res: TypedResponse<ApiResponse<comment[]>>): Promise<any> => {
    const post_id = req.params.id;
    const comments = await prisma.comment.findMany({
        where: { post_id },
        include: {
            author: {
                select: { username: true }
            }
        }
    });
    try {
        if (!comments) {
            return res.status(404).json({ success: false, message: "There is no comment in this post" })
        }

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
                replies: []
            });
        })
        const root: any[] = [];
        comments.forEach((comment : any) => {
            const currentcomment = commentObj.get(comment.id);
            if (comment.parent_comment_id) {
                const parentcomment = commentObj.get(comment.parent_comment_id);
                if (parentcomment) {
                    parentcomment.replies.push(currentcomment);
                }
            } else {
                root.push(currentcomment);
            }
        })

        return res.status(200).json({ success: true, message: "All post comment", data: root })
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

