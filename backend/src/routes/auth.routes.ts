import { Router } from 'express';
import { login, signup, logout, getMe, updateMe } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();
router.post('/login', login);
router.post('/signup', signup);
router.post('/logout', logout);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
export default router;
