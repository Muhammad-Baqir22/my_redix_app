import { Request, Response } from "express";
import bcrypt from 'bcrypt';
import prisma from "../db/prismaclient";
import Jwt from 'jsonwebtoken';

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
        const token = Jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '2d' })
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

