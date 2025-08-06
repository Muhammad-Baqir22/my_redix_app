import Router from 'express';
import { votePost } from '../Controllers/vote.controller';
import {tokenVerify} from '../Middleware/auth.middleware'
import { commentVote } from '../Controllers/vote.controller';
import validaterequest from "../Middleware/validateRequest.middleware";
import {votepost} from '../validators/votepost.validator'
import {commentvote} from '../validators/commentvote.validator'
const router = Router();

router.post('/',validaterequest(votepost),tokenVerify,votePost);
router.post('/comment',validaterequest(commentvote),tokenVerify,commentVote);

export default router;