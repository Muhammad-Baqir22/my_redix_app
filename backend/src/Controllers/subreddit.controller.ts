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

export const getsubs = async (req:Request , res: TypedResponse<ApiResponse<subreddit[]>>) : Promise<any>=>{
    try{
        const user_id = (req as any).user_id;
        const subs = await prisma.subreddit.findMany({
            where: {created_by:user_id}
    });
        if(!subs)
            return res.status(404).json({success:false,message:"No subredit"})
        return res.status(200).json({success:true,message:"Subreddits",data:subs})
        }catch(error:any){
            return res.status(500).json({success:false,message:"Subreddits Not found",error:error.message})
        }
}