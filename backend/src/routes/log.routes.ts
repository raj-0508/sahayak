import { Router } from 'express';
import { protect, requireAdmin } from '../middleware/auth.middleware';
import { getLogs, createLog } from '../controllers/log.controller';
const router = Router();
router.get('/', protect, requireAdmin, getLogs);
router.post('/', createLog);
export default router;
