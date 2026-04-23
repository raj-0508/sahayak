import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getSubmissions, evaluateSubmission, getMyProgress } from '../controllers/testSubmission.controller';
const router = Router();
router.get('/', protect, getSubmissions);
router.get('/my-progress', protect, getMyProgress);
router.put('/:id/evaluate', protect, evaluateSubmission);
export default router;
