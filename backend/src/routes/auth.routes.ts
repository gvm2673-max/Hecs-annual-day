import { Router } from 'express';
import { loginAdmin, verifyAdmin, logoutAdmin, changePassword } from '../controllers/auth.controller.js';
import { requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/auth/login', loginAdmin);
router.post('/auth/verify', verifyAdmin);
router.post('/auth/logout', logoutAdmin);
router.post('/auth/change-password', requireAdmin, changePassword);

export default router;
