import { Request , Response} from "express";
import { genrateSignedUrl } from "../utils/s3";

export const genrateSignedUrlController = async (req:Request, res: Response)=>{
    const {filename,contentType} = req.body;
    if (!filename || !contentType) {
    return res.status(400).json({ success: false, message: 'Filename and contentType required' });
}

    const key = `uploads/${Date.now()}-${filename}`;
    try{
    const signedUrl = await genrateSignedUrl(key, contentType);
    const fileUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    return res.json({ success: true, signedUrl, media_Url: fileUrl });
    }catch(error){
        return res.status(500).json({ success: false, message: 'Error generating signed URL'});
    }

}