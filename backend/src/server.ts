import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import subjectRoutes from './routes/subject.routes';
import classRoutes from './routes/class.routes';
import contentRoutes from './routes/content.routes';
import joinRequestRoutes from './routes/joinRequest.routes';
import testRoutes from './routes/test.routes';
import testSubmissionRoutes from './routes/testSubmission.routes';
import progressRoutes from './routes/progress.routes';
import logRoutes from './routes/log.routes';
import subjectMaterialRoutes from './routes/subjectMaterial.routes';
import aiRoutes from './routes/ai.routes';
import exportRoutes from './routes/export.routes';

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:9002';
const allowedOrigins = [FRONTEND_URL, 'https://sahayak-rc1m.vercel.app'];

connectDB();

app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, 
  methods: ['GET','POST','PUT','DELETE','OPTIONS'], 
  allowedHeaders: ['Content-Type','Authorization', 'Cookie'] 
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/join-requests', joinRequestRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/test-submissions', testSubmissionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/subject-materials', subjectMaterialRoutes);
app.use('/api', aiRoutes);
app.use('/api/export', exportRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Sahayak Backend running on http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api`);
  console.log(`🌐 CORS: ${FRONTEND_URL}\n`);
});
export default app;
