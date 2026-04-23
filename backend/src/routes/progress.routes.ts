import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getProgress, saveProgress } from '../controllers/progress.controller';
const router = Router();
router.get('/', protect, getProgress);
router.post('/', protect, saveProgress);
export default router;
