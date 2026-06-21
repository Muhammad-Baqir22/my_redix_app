import { Router } from 'express';
import { createUser, searchUsers, getUserProfile, updateUserProfile } from '../Controllers/user.controllers';
import validaterequest from '../Middleware/validateRequest.middleware';
import userValidation from '../validators/user.validator'
import { tokenVerify } from '../Middleware/auth.middleware';
import { followuser, getfolllowUser, unfollowuser, getfollowers } from '../Controllers/userfollow.controller';
const router = Router();
router.post('/', validaterequest(userValidation),createUser);
router.get('/search', tokenVerify, searchUsers);
router.post('/userfollow',tokenVerify,followuser);
router.get('/userfollow',tokenVerify,getfolllowUser);
router.get('/followers',tokenVerify,getfollowers);
router.post('/userunfollow',tokenVerify,unfollowuser);
router.patch('/profile', tokenVerify, updateUserProfile);
router.get('/:username', tokenVerify, getUserProfile);


export default router;
