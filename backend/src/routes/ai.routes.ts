import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { askGanesha } from '../controllers/askGanesha.controller';
import { generateContent } from '../controllers/generateContent.controller';
import { generateQuestions } from '../controllers/generateQuestions.controller';
import { analyzeContent } from '../controllers/analyzeContent.controller';
import { conceptVisualizer } from '../controllers/conceptVisualizer.controller';
import { extractPdf } from '../controllers/extractPdf.controller';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const router = Router();

router.post('/ask-ganesha', protect, askGanesha);
router.post('/generate-content', protect, generateContent);
router.post('/generate-questions', protect, generateQuestions);
router.post('/analyze-content', protect, analyzeContent);
router.post('/concept-visualizer', protect, conceptVisualizer);
router.post('/extract-pdf', protect, upload.single('file'), extractPdf);
export default router;
