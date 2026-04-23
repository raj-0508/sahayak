import { Request, Response } from 'express';
import Content from '../models/Content';
import Class from '../models/Class';
import connectDB from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

export async function getContent(req: AuthRequest, res: Response) {
  try {
    await connectDB(); const u = req.user;
    const classId = req.query.class_id as string;
    let query: any = {};
    if (u.user_type === 'teacher') { query.teacher_id = u._id; if (classId) query.class_id = classId; }
    else if (u.user_type === 'student') {
      const enrolled = await Class.find({ students: u._id }).select('_id');
      const validIds = enrolled.map((c: any) => c._id.toString());
      if (classId) { if (!validIds.includes(classId)) return res.status(403).json({ error: 'Unauthorized' }); query.class_id = classId; }
      else query.class_id = { $in: validIds };
    }
    else if (classId) query.class_id = classId;
    const content = await Content.find(query).populate('class_id','class_name').populate('teacher_id','name').sort({ created_at: -1 });
    return res.json({ content });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}

export async function createContent(req: AuthRequest, res: Response) {
  try {
    const u = req.user;
    if (u.user_type !== 'teacher') return res.status(403).json({ error: 'Teacher access required' });
    await connectDB();
    const { class_id, title, content, content_type } = req.body;
    if (!class_id || !title || !content) return res.status(400).json({ error: 'Class ID, title, and content are required' });
    const classData = await Class.findById(class_id);
    if (!classData) return res.status(404).json({ error: 'Class not found' });
    if (classData.teacher_id.toString() !== u._id.toString()) return res.status(403).json({ error: 'You can only add content to your own classes' });
    const newContent = await Content.create({ class_id, teacher_id: u._id, title, content, content_type: content_type || 'note' });
    const populated = await Content.findById(newContent._id).populate('class_id','class_name').populate('teacher_id','name');
    return res.status(201).json({ content: populated });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}
