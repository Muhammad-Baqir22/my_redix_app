import Router from 'express';
import { getnotification } from '../Controllers/notification.controller.js';
const router = Router();

router.get('/',getnotification)

export default router;