import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getJoinRequests, createJoinRequest, handleJoinRequest, deleteJoinRequest } from '../controllers/joinRequest.controller';
const router = Router();
router.get('/', protect, getJoinRequests);
router.post('/', protect, createJoinRequest);
router.put('/:id', protect, handleJoinRequest);
router.delete('/:id', protect, deleteJoinRequest);
export default router;
