import { Router } from "express";
import {postcomment} from '../Controllers/comment.controller'
import {tokenVerify} from '../Middleware/auth.middleware';
import {getcomments} from '../Controllers/comment.controller'
import validaterequest from "../Middleware/validateRequest.middleware";
import commentValidator from "../validators/comment.validator"
const router = Router();

router.post('/',validaterequest(commentValidator),tokenVerify,postcomment);
router.get('/:id',tokenVerify,getcomments);

export default router;