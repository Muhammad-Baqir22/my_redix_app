import Router from 'express';
import { getnotification, getUnreadCount, markAllRead } from '../Controllers/notification.controller';
import { tokenVerify } from '../Middleware/auth.middleware';

const router = Router();

router.get('/', tokenVerify, getnotification);
router.get('/unread-count', tokenVerify, getUnreadCount);
router.patch('/mark-read', tokenVerify, markAllRead);

export default router;
