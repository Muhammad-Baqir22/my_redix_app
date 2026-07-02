import {Request,Response} from 'express';
import prisma from '../db/prismaclient'
import { TypedResponse } from '../types/typedResponse';
import {subreddit} from '../ResponseModel/subreddit.ResponseModel'
import { ApiResponse } from '../ResponseModel/api.ResponseModel';

export const createSub = async (req:Request , res: TypedResponse<ApiResponse<subreddit>>) : Promise<any> =>{
    const {name,description} = req.body;
    const user_id = (req as any).user_id;

    try{
        const subreddit = await prisma.subreddit.create({
            data:{
                name,
                description,
                created_by:user_id

        }
        });

        return res.status(200).json({success:true,message: "Subreddit Created",data:{ id:subreddit.id,name:subreddit.name,description:subreddit.description,created_by:subreddit.created_by }})
        
    }catch(error:any){
        return res.status(500).json({success:false,message:"Subreddit Not created",error: error.message})
    }

}

export const searchSubs = async (req: Request, res: TypedResponse<ApiResponse<subreddit[]>>): Promise<any> => {
    const q = (req.query.q as string ?? "").trim();
    if (!q) return res.status(200).json({ success: true, message: "No query", data: [] });
    try {
        const subs = await prisma.subreddit.findMany({
            where: { name: { contains: q } },
            take: 20,
        });
        return res.status(200).json({ success: true, message: "Subreddits found", data: subs });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: "Search failed", error: error.message });
    }
};

export const getsubs = async (req:Request , res: TypedResponse<ApiResponse<any[]>>) : Promise<any>=>{
    try{
        const user_id = (req as any).user_id;
        const [subs, userFollows] = await Promise.all([
            prisma.subreddit.findMany({
                include: { _count: { select: { followers: true } } },
                orderBy: { created_at: 'desc' },
            }),
            prisma.userSubs.findMany({
                where: { followed_by_id: user_id },
                select: { subs_id: true },
            }),
        ]);
        const followedIds = new Set(userFollows.map((f: any) => f.subs_id));
        const data = subs.map((s: any) => ({
            id: s.id, name: s.name, description: s.description,
            created_by: s.created_by, member_count: s._count.followers,
            is_following: followedIds.has(s.id),
        }));
        return res.status(200).json({success:true,message:"Subreddits",data})
    }catch(error:any){
        return res.status(500).json({success:false,message:"Subreddits Not found",error:error.message})
    }
}

export const getSubredditByName = async (req: Request, res: Response): Promise<any> => {
    const { name } = req.params;
    try {
        const sub = await prisma.subreddit.findUnique({
            where: { name },
            include: { _count: { select: { followers: true } } },
        });
        if (!sub) return res.status(404).json({ success: false, message: "Community not found" });
        const user_id = (req as any).user_id;
        const isFollowing = user_id ? !!(await prisma.userSubs.findUnique({
            where: { followed_by_id_subs_id: { followed_by_id: user_id, subs_id: sub.id } },
        })) : false;
        return res.status(200).json({ success: true, message: "Community found", data: {
            id: sub.id, name: sub.name, description: sub.description,
            created_by: sub.created_by, member_count: (sub as any)._count.followers, is_following: isFollowing,
        }});
    } catch (error: any) {
        return res.status(500).json({ success: false, message: "Failed", error: error.message });
    }
};

export const getPostsBySubreddit = async (req: Request, res: Response): Promise<any> => {
    const { name } = req.params;
    const page  = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.pageSize as string) || 20;
    const skip  = (page - 1) * limit;
    try {
        const sub = await prisma.subreddit.findUnique({ where: { name } });
        if (!sub) return res.status(404).json({ success: false, message: "Community not found" });

        const posts = await prisma.post.findMany({
            where: { subreddit_id: sub.id },
            skip, take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                author: { select: { username: true } },
                subreddit: { select: { name: true } },
            },
        });

        const data = await Promise.all(posts.map(async (post: any) => {
            const vote_post = await prisma.postVote.aggregate({
                where: { post_id: post.id }, _sum: { vote_type: true },
            });
            const comments = await prisma.comment.findMany({ where: { post_id: post.id } });
            return {
                id: post.id, title: post.title, content: post.content,
                user_id: post.user_id, subreddit_id: post.subreddit_id,
                username: post.author.username, subreddit_name: post.subreddit?.name ?? null,
                votes: vote_post._sum.vote_type || 0,
                comment: comments, media_url: post.media_url, created_at: post.created_at,
            };
        }));

        return res.status(200).json({ success: true, message: "Posts found", data, pageNo: page, pageSize: limit });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: "Failed", error: error.message });
    }
};