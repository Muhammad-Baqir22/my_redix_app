import { Router } from "express";
import {postController} from '../Controllers/post.controller'
import {getallPostController} from '../Controllers/post.controller'
import {getuserpost} from '../Controllers/post.controller'
import {tokenVerify} from '../Middleware/auth.middleware';
import postValidation from "../validators/create_post.validator";
import validaterequest from "../Middleware/validateRequest.middleware";
import {getpostbyid} from '../Controllers/post.controller'
const router = Router();

router.post('/',validaterequest(postValidation),tokenVerify,postController);
router.get('/',tokenVerify,getallPostController);
router.get('/user',tokenVerify,getuserpost);
router.get('/post/:id',tokenVerify,getpostbyid)


export default router;