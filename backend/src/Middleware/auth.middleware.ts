import { Request,Response,NextFunction } from "express";

import JWT from 'jsonwebtoken';

export const tokenVerify =async (req:Request,res:Response,next:NextFunction) : Promise<any> =>{
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if(!token)
        return res.status(401).json({message:"Token Missing"})
    try{
    const verifyt = JWT.verify(token,process.env.JWT_SECRET!);

    (req as any).user_id = (verifyt as any).id;
    next();
    }catch(error){
       res.status(403).json({ message: "Invalid or expired token" });

    }

}

