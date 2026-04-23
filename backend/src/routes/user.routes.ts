import { Router } from 'express';
import { protect, requireAdmin } from '../middleware/auth.middleware';
import { getUsers, createUser, getUser, updateUser, deleteUser } from '../controllers/user.controller';

const router = Router();
router.get('/', protect, requireAdmin, getUsers);
router.post('/', protect, requireAdmin, createUser);
router.get('/:id', protect, getUser);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, requireAdmin, deleteUser);
export default router;
