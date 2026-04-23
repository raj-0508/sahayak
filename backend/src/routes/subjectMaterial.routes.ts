import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getMaterials, uploadMaterial, getMaterial, deleteMaterial } from '../controllers/subjectMaterial.controller';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const router = Router();
router.get('/', protect, getMaterials);
router.post('/', protect, upload.single('file'), uploadMaterial);
router.get('/:id', protect, getMaterial);
router.delete('/:id', protect, deleteMaterial);
export default router;
