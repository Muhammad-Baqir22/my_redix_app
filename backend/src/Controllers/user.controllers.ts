import { Request, Response } from "express";
import bcrypt from 'bcrypt';
import prisma from "../db/prismaclient";
import Jwt from 'jsonwebtoken';
import admin from '../firebase';

import { ApiResponse} from "../ResponseModel/api.ResponseModel";
import {AuthResponse} from "../ResponseModel/auth.ResponseModel";
import { TypedResponse } from '../types/typedResponse';


export const createUser = async (req: Request, res: Response) : Promise<any> => {
    const { username, email, password } = req.body;
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password_hash: hashedPassword
            },
        });
        return res.status(201).json({ success: true,message: 'user Created', data: {user:{ id: user.id, username: user.username,email:user.email }} });
    } catch (error: any) {
        return res.json({
            success: false,
            message: "Somethis wrong",
            error: error.message,

        });


    }
};

export const getUserProfile = async (req: Request, res: Response): Promise<any> => {
    const { username } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true, username: true, created_at: true, avatar_url: true, banner_url: true },
        });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const [followers_count, following_count] = await Promise.all([
            prisma.userfollow.count({ where: { user_id: user.id } }),
            prisma.userfollow.count({ where: { followed_by_id: user.id } }),
        ]);

        return res.status(200).json({
            success: true, message: "User found",
            data: { ...user, followers_count, following_count },
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: "Failed", error: error.message });
    }
};

export const updateUserProfile = async (req: Request, res: Response): Promise<any> => {
    const userId = (req as any).user_id;
    const { avatar_url, banner_url } = req.body;
    try {
        const data: Record<string, string> = {};
        if (avatar_url !== undefined) data.avatar_url = avatar_url;
        if (banner_url !== undefined) data.banner_url = banner_url;

        const user = await prisma.user.update({
            where: { id: userId },
            data,
            select: { id: true, username: true, avatar_url: true, banner_url: true },
        });
        return res.status(200).json({ success: true, message: "Profile updated", data: user });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: "Update failed", error: error.message });
    }
};

export const searchUsers = async (req: Request, res: Response): Promise<any> => {
    const q = (req.query.q as string ?? "").trim();
    if (!q) return res.status(200).json({ success: true, message: "No query", data: [] });
    try {
        const users = await prisma.user.findMany({
            where: { username: { contains: q } },
            select: { id: true, username: true, email: true, avatar_url: true },
            take: 20,
        });
        return res.status(200).json({ success: true, message: "Users found", data: users });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: "Search failed", error: error.message });
    }
};

export const loginController = async (req: Request, res: TypedResponse<ApiResponse<AuthResponse>>) : Promise<any> => {
    const { email, password,fcm_token } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        })
        if (!user)
            return res.status(400).json({ success: false, message: "Not found"})

        const passMatch = await bcrypt.compare(password, user.password_hash);
        if (!passMatch)
            res.status(401).json({success: false , message : "Incorrect Password"});
        const token = Jwt.sign({ id: user.id, email: user.email , sub: user.id }, process.env.JWT_SECRET!, { algorithm:"HS256",expiresIn: '2d' })
        if(fcm_token){
            await prisma.user.update({
                where:{
                    email
                },
                data:{
                    fcm_token
                }
            })
        }
        return res.status(200).json({success: true, message: "Login successFull", data:{user: { id: user.id,username:user.username, email: user.email },token} });
    } catch (error:any) {
        res.status(500).json({
            success:false,
            message: "Login Failed",
            error:error.message,
    });
    }
};

export const googleAuthController = async (req: Request, res: Response): Promise<any> => {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ success: false, message: "ID token required" });

    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        const { email, name, picture, uid } = decoded;

        if (!email) return res.status(400).json({ success: false, message: "No email in Google account" });

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            const username = (name ?? email.split("@")[0]).replace(/\s+/g, "").toLowerCase() + "_" + uid.slice(0, 5);
            user = await prisma.user.create({
                data: { email, username, password_hash: "", avatar_url: picture ?? null },
            });
        }

        const token = Jwt.sign(
            { id: user.id, email: user.email, sub: user.id },
            process.env.JWT_SECRET!,
            { algorithm: "HS256", expiresIn: "2d" }
        );

        return res.status(200).json({
            success: true,
            message: "Google login successful",
            data: { user: { id: user.id, username: user.username, email: user.email }, token },
        });
    } catch (error: any) {
        return res.status(401).json({ success: false, message: "Invalid Google token", error: error.message });
    }
};

