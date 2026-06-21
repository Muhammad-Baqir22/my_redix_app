import { Request, Response } from "express";
import prisma from '../db/prismaclient'

export const followuser = async (req: Request, res: Response) => {
    const followed_by_id = (req as any).user_id;
    const follow_id = req.body.follow_id;
    try {
        const check = await prisma.userfollow.findUnique({
            where: {
                followed_by_id_user_id: {
                    followed_by_id,
                    user_id: follow_id
                }
            }
        })
        if (check) {
            return res.json({ success: false, message: "You already follow user" })
        }
        else {
            const [follow, follower] = await Promise.all([
                prisma.userfollow.create({ data: { followed_by_id, user_id: follow_id } }),
                prisma.user.findUnique({ where: { id: followed_by_id }, select: { username: true } }),
            ]);

            // Notify the followed user
            await prisma.notification.create({
                data: {
                    user_id: follow_id,
                    type: "follow",
                    Read: false,
                    message: `u/${follower?.username ?? "Someone"} started following you`,
                },
            });

            return res.status(200).json({ success: true, message: "You followed the user successfully", data: follow })
        }
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const getfolllowUser = async (req: Request, res: Response) => {
    const followed_by_id = (req as any).user_id;

    try {
        const follow = await prisma.userfollow.findMany({
            where: { followed_by_id },
            include: {
                user: {
                    select: { id: true, username: true, email: true, avatar_url: true }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Followed users retrieved",
            data: follow
        });

    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


export const getfollowers = async (req: Request, res: Response): Promise<any> => {
    const user_id = (req as any).user_id;
    try {
        const followers = await prisma.userfollow.findMany({
            where: { user_id },
            include: {
                followby: { select: { id: true, username: true, email: true, avatar_url: true } }
            }
        });
        return res.status(200).json({ success: true, message: "Followers retrieved", data: followers });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const unfollowuser = async (req: Request, res: Response) => {
    const followed_by_id = (req as any).user_id;
    const follow_id = req.body.follow_id;
    try{
        const check = await prisma.userfollow.findUnique({
            where: {
                followed_by_id_user_id: {
                    followed_by_id,
                    user_id: follow_id
                }
            }
        })
        if (!check) {
            return res.status(404).json({ success: false, message: "You don't follow this user"})
        }
        else {
            const unfollow = await prisma.userfollow.delete({
                where: {
                    followed_by_id_user_id: {
                    followed_by_id,
                    user_id: follow_id
                }
            }
            })
            if(unfollow){
                return res.status(200).json({ success: true, message: "You unfollowed the user"})
            }
        }
    }catch(error:any){
        return res.status(500).json({success:false,message:error.message})
    }
}