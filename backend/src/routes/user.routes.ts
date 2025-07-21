import { Router } from 'express';
import { createUser } from '../Controllers/user.controllers.js';
import validaterequest from '../Middleware/validateRequest.middleware.js';
import userValidation from '../validators/user.validator.js'
import { tokenVerify } from '../Middleware/auth.middleware.js';
import { followuser } from '../Controllers/userfollow.controller.js';
import { getfolllowUser } from '../Controllers/userfollow.controller.js';
import { unfollowuser } from '../Controllers/userfollow.controller.js';
const router = Router();
router.post('/', validaterequest(userValidation),createUser);
router.post('/userfollow',tokenVerify,followuser);
router.get('/userfollow',tokenVerify,getfolllowUser);
router.post('/userunfollow',tokenVerify,unfollowuser)


export default router;
