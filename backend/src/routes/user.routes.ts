import { Router } from 'express';
import { createUser, searchUsers } from '../Controllers/user.controllers';
import validaterequest from '../Middleware/validateRequest.middleware';
import userValidation from '../validators/user.validator'
import { tokenVerify } from '../Middleware/auth.middleware';
import { followuser } from '../Controllers/userfollow.controller';
import { getfolllowUser } from '../Controllers/userfollow.controller';
import { unfollowuser } from '../Controllers/userfollow.controller';
const router = Router();
router.post('/', validaterequest(userValidation),createUser);
router.get('/search', tokenVerify, searchUsers);
router.post('/userfollow',tokenVerify,followuser);
router.get('/userfollow',tokenVerify,getfolllowUser);
router.post('/userunfollow',tokenVerify,unfollowuser)


export default router;
