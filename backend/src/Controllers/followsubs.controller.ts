import { Request, Response } from "express";
import prisma from '../db/prismaclient.js'
import admin from "../firebase.js";


export const followcontroller = async (req: Request, res: Response) => {

  const followed_by_id = (req as any).user_id;
  const subs_id = req.body.sub_id;
  const check = await prisma.userSubs.findUnique({
    where: {
      followed_by_id_subs_id: {
        followed_by_id,
        subs_id
      }
    }
  });
  if (check) {
    res.json({ success: false, message: "User already follow the subs" })
  }
  const subredditExists = await prisma.subreddit.findUnique({
    where: {
      id: subs_id,
    },
  });

  if (!subredditExists) {
    return res.status(400).json({
      success: false,
      message: "Subreddit not found. Cannot follow.",
    });
  }
  const subreddit = await prisma.userSubs.create({
    data: {
      followed_by_id: followed_by_id,
      subs_id
    }

  })
  const sub_userid = await prisma.subreddit.findUnique({
    where: {
      id: subs_id
    },
    include: {
      creator: {
        select: {
          fcm_token: true
        }
      }
    }
  })
  
  const follower = await prisma.user.findUnique({
    where: {
      id: followed_by_id
    }
  })
  if (sub_userid?.creator.fcm_token) {
    const message = {
      notification: {
        title: 'New Follower!',
        body: `${follower?.username} followed you.`
      },
      token: sub_userid.creator.fcm_token,
    };

    try {
      await admin.messaging().send(message);
      console.log('Message sent successfully');
    } catch (error: any) {
      console.log('Error sending message:', error);
    }
  }
  res.json({ success: true, message: 'followed', data: subreddit })


}

export const getfollowsubs = async (req: Request, res: Response): Promise<any> => {
  const followed_by_id = (req as any).user_id;
  const subs = await prisma.userSubs.findMany({
    where: {
      followed_by_id
    },
  })
  if (!subs) {
    return res.status(400).json({ success: false, message: "You did not have follow any subs" });
  }
  return res.json({ success: true, message: 'get follow subs', data: subs });
}

export const unfollowsub = async (req: Request, res: Response): Promise<any> => {
  const followed_by_id = (req as any).user_id;
  const subs_id = req.body.sub_id;
  const check = await prisma.userSubs.findUnique({
    where: {
      followed_by_id_subs_id: {
        followed_by_id,
        subs_id
      }
    }
  })
  if (check) {
    const unfollow = await prisma.userSubs.delete({
      where: {
        followed_by_id_subs_id: {
          followed_by_id,
          subs_id
        }
      }
    })
    return res.status(200).json({ success: true, message: "Subs unfollowed", data: unfollow })
  }
  return res.status(400).json({ success: false, message: "You did not follow this sub" })
}