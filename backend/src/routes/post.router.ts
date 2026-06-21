import { Router } from "express";
import {postController, getallPostController, getuserpost, getpostbyid, getpostbyusername, getpopularposts} from '../Controllers/post.controller'
import {tokenVerify} from '../Middleware/auth.middleware';
import postValidation from "../validators/create_post.validator";
import validaterequest from "../Middleware/validateRequest.middleware";
const router = Router();

router.post('/',validaterequest(postValidation),tokenVerify,postController);
router.get('/',tokenVerify,getallPostController);
router.get('/popular', tokenVerify, getpopularposts);
router.get('/user',tokenVerify,getuserpost);
router.get('/user/:username',tokenVerify,getpostbyusername);
router.get('/post/:id',tokenVerify,getpostbyid)


export default router;