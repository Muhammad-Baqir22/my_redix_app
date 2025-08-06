import { Router } from "express";
import {loginController } from '../Controllers/user.controllers';
import validaterequest from '../Middleware/validateRequest.middleware';
import loginValidator from "../validators/login.validator";

const router = Router();

router.post('/login' ,validaterequest(loginValidator),loginController);
export default router;