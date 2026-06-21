import { Request, Response } from "express";
import prisma from "../db/prismaclient";

export const getnotification = async (req: Request, res: Response) => {
    const user_id = (req as any).user_id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.pageSize as string) || 20;
    const skip = (page - 1) * limit;

    try {
        const notifications = await prisma.notification.findMany({
            skip,
            take: limit,
            where: { user_id },
            orderBy: { created_at: "desc" },
        });
        return res.status(200).json({ success: true, message: "All notification Fetched Successfully!", data: notifications });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getUnreadCount = async (req: Request, res: Response) => {
    const user_id = (req as any).user_id;
    try {
        const count = await prisma.notification.count({ where: { user_id, Read: false } });
        return res.status(200).json({ success: true, data: { count } });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const markAllRead = async (req: Request, res: Response) => {
    const user_id = (req as any).user_id;
    try {
        await prisma.notification.updateMany({ where: { user_id, Read: false }, data: { Read: true } });
        return res.status(200).json({ success: true, message: "All notifications marked as read" });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
