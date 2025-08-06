import {Router} from 'express';
import {createSub} from '../Controllers/subreddit.controller'
import {getsubs} from '../Controllers/subreddit.controller'
import {tokenVerify} from '../Middleware/auth.middleware'
import validaterequest from '../Middleware/validateRequest.middleware';
import subsValidation from '../validators/create_subs.validator'
import {followcontroller} from '../Controllers/followsubs.controller'
import subfollowValidation from "../validators/subfollow.validator";
import {getfollowsubs} from '../Controllers/followsubs.controller'
import {unfollowsub} from '../Controllers/followsubs.controller'
const router = Router();

router.post('/sub',validaterequest(subsValidation),tokenVerify,createSub)

router.get('/subs/',tokenVerify,getsubs)

router.post('/followsub',validaterequest(subfollowValidation),tokenVerify,followcontroller);

router.get('/followsub',tokenVerify,getfollowsubs);

router.post('/unfollowsub',tokenVerify,unfollowsub);

export default router;