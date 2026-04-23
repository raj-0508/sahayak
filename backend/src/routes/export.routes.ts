import { Router, Request, Response } from 'express';
import { protect, requireAdmin } from '../middleware/auth.middleware';
import User from '../models/User';
import Class from '../models/Class';
import Subject from '../models/Subject';
import Content from '../models/Content';
import Log from '../models/Log';
import Progress from '../models/Progress';

const router = Router();

// Helper to convert array of objects to CSV string
function toCSV(data: any[]): string {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

// GET /api/export/users
router.get('/users', protect, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await User.find({}).select('-password').lean();
    const csv = toCSV(users.map(u => ({
      id: u._id, name: u.name, email: u.email,
      user_type: u.user_type, phone: u.phone || '',
      grade_level: u.grade_level || '', created_at: u.created_at
    })));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    return res.send(csv);
  } catch { return res.status(500).json({ error: 'Export failed' }); }
});

// GET /api/export/classes
router.get('/classes', protect, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const classes = await Class.find({})
      .populate('teacher_id', 'name email')
      .populate('subject_id', 'name')
      .lean();
    const csv = toCSV(classes.map((c: any) => ({
      id: c._id,
      class_name: c.class_name,
      teacher: c.teacher_id?.name || '',
      subject: c.subject_id?.name || '',
      grade_level: c.grade_level,
      student_count: c.students?.length || 0,
      created_at: c.created_at
    })));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="classes.csv"');
    return res.send(csv);
  } catch { return res.status(500).json({ error: 'Export failed' }); }
});

// GET /api/export/subjects
router.get('/subjects', protect, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const subjects = await Subject.find({}).lean();
    const csv = toCSV(subjects.map((s: any) => ({
      id: s._id, name: s.name, description: s.description || '',
      grade_levels: (s.grade_levels || []).join(';'), created_at: s.created_at
    })));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="subjects.csv"');
    return res.send(csv);
  } catch { return res.status(500).json({ error: 'Export failed' }); }
});

// GET /api/export/content
router.get('/content', protect, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const content = await Content.find({})
      .populate('teacher_id', 'name')
      .populate('class_id', 'class_name')
      .lean();
    const csv = toCSV(content.map((c: any) => ({
      id: c._id, title: c.title,
      content_type: c.content_type,
      teacher: c.teacher_id?.name || '',
      class: c.class_id?.class_name || '',
      created_at: c.created_at
    })));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="content.csv"');
    return res.send(csv);
  } catch { return res.status(500).json({ error: 'Export failed' }); }
});

// GET /api/export/logs
router.get('/logs', protect, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const logs = await Log.find({}).sort({ timestamp: -1 }).limit(1000).lean();
    const csv = toCSV(logs.map((l: any) => ({
      id: l._id, timestamp: l.timestamp, level: l.level, message: l.message
    })));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="logs.csv"');
    return res.send(csv);
  } catch { return res.status(500).json({ error: 'Export failed' }); }
});

// GET /api/export/progress
router.get('/progress', protect, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const progress = await Progress.find({})
      .populate('student_id', 'name email')
      .lean();
    const csv = toCSV(progress.map((p: any) => ({
      id: p._id,
      student: p.student_id?.name || '',
      email: p.student_id?.email || '',
      total_tests: p.total_tests || 0,
      average_score: p.average_score || 0,
      created_at: p.created_at
    })));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="progress.csv"');
    return res.send(csv);
  } catch { return res.status(500).json({ error: 'Export failed' }); }
});

export default router;
