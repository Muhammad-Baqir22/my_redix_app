import { Request, Response } from "express";
import prisma from "../db/prismaclient";

export const savePost = async (req: Request, res: Response): Promise<any> => {
    const user_id = (req as any).user_id;
    const { post_id } = req.body;
    if (!post_id) return res.status(400).json({ success: false, message: "post_id required" });
    try {
        await prisma.savedPost.create({ data: { user_id, post_id } });
        return res.status(200).json({ success: true, message: "Post saved" });
    } catch (error: any) {
        if (error.code === "P2002")
            return res.status(400).json({ success: false, message: "Already saved" });
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const unsavePost = async (req: Request, res: Response): Promise<any> => {
    const user_id = (req as any).user_id;
    const { post_id } = req.body;
    if (!post_id) return res.status(400).json({ success: false, message: "post_id required" });
    try {
        await prisma.savedPost.delete({
            where: { user_id_post_id: { user_id, post_id } },
        });
        return res.status(200).json({ success: true, message: "Post unsaved" });
    } catch {
        return res.status(404).json({ success: false, message: "Not saved" });
    }
};

export const getSaved = async (req: Request, res: Response): Promise<any> => {
    const user_id = (req as any).user_id;
    try {
        const saved = await prisma.savedPost.findMany({
            where: { user_id },
            orderBy: { created_at: "desc" },
            include: {
                post: {
                    include: {
                        author:    { select: { username: true } },
                        subreddit: { select: { name: true } },
                    },
                },
            },
        });

        const data = await Promise.all(saved.map(async ({ post }: any) => {
            const vote_post = await prisma.postVote.aggregate({
                where: { post_id: post.id }, _sum: { vote_type: true },
            });
            const comments = await prisma.comment.findMany({ where: { post_id: post.id } });
            return {
                id: post.id, title: post.title, content: post.content,
                user_id: post.user_id, subreddit_id: post.subreddit_id,
                username: post.author.username,
                subreddit_name: post.subreddit?.name ?? null,
                votes: vote_post._sum.vote_type || 0,
                comment: comments,
                media_url: post.media_url, created_at: post.created_at,
            };
        }));

        return res.status(200).json({ success: true, message: "Saved posts", data });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getSavedIds = async (req: Request, res: Response): Promise<any> => {
    const user_id = (req as any).user_id;
    try {
        const saved = await prisma.savedPost.findMany({
            where: { user_id }, select: { post_id: true },
        });
        return res.status(200).json({ success: true, message: "OK", data: saved.map((s: any) => s.post_id) });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
