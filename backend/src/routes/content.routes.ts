import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getContent, createContent } from '../controllers/content.controller';
const router = Router();
router.get('/', protect, getContent);
router.post('/', protect, createContent);
export default router;
