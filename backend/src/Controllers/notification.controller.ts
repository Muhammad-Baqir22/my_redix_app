import { Request, Response } from "express";
import prisma from "../db/prismaclient.js";
export const getnotification = async (req: Request, res: Response) => {
    const user_id = (req as any).user_id;
    const page = parseInt(req.query.page as string)||1;
    const limit = parseInt(req.query.pageSize as string)||10;
    const skip = (page - 1) * limit;

    try {
        const notification = await prisma.notification.findMany({
            skip:skip,
            take:limit,
            where: {
                user_id: user_id
            },
            orderBy: {
                created_at: 'desc'
            }
        })
        if(!notification){
            return res.status(404).json({message: "No notifications found"});
        }
        return res.status(200).json({success:true,message:"All notification Fetched Successfully!",data:notification})
    }catch(error: any){
        return res.status(500).json({success:false,message:error.message});
    }
}
