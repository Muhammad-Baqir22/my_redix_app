import { Router } from "express";
import {followcontroller} from '../Controllers/followsubs.controller'
import {tokenVerify} from '../Middleware/auth.middleware';
import subfollowValidation from "../validators/subfollow.validator";
import validaterequest from "../Middleware/validateRequest.middleware";
import {getfollowsubs} from '../Controllers/followsubs.controller'
import {unfollowsub} from '../Controllers/followsubs.controller'

const router = Router();

router.post('/followsubs',validaterequest(subfollowValidation),tokenVerify,followcontroller);
router.get('/getfollowsubs',tokenVerify,getfollowsubs);
router.post('/unfollowsub',tokenVerify,unfollowsub);

export default router;