import { Request, Response } from "express";
import prisma from '../db/prismaclient.js'

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
            const follow = await prisma.userfollow.create({
                data: {
                    followed_by_id,
                    user_id: follow_id
                }
            })
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
            where: {
                followed_by_id
            }
        })
        if(!follow){
            return res.status(404).json({ success: false, message: "You don't follow any user" })
        }
        return res.status(200).json({ success: true, message: "You followed the user",data:follow})
    }catch(error:any){
        return res.status(500).json({ success: false, message: error.message })
    }
}

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