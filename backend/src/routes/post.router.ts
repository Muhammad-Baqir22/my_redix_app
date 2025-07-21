import { Router } from "express";
import {postController} from '../Controllers/post.controller.js'
import {getallPostController} from '../Controllers/post.controller.js'
import {getuserpost} from '../Controllers/post.controller.js'
import {tokenVerify} from '../Middleware/auth.middleware.js';
import postValidation from "../validators/create_post.validator.js";
import validaterequest from "../Middleware/validateRequest.middleware.js";
import {getpostbyid} from '../Controllers/post.controller.js'
const router = Router();

router.post('/',validaterequest(postValidation),tokenVerify,postController);
router.get('/',tokenVerify,getallPostController);
router.get('/user',tokenVerify,getuserpost);
router.get('/post/:id',tokenVerify,getpostbyid)


export default router;