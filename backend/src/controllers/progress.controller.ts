import { Request, Response } from 'express';
import Progress from '../models/Progress';
import connectDB from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

export async function getProgress(req: AuthRequest, res: Response) {
  try {
    await connectDB(); const u = req.user;
    const { student_id, class_id } = req.query;
    let query: any = {};
    if (u.user_type === 'student') query.student_id = u._id;
    else if (student_id) query.student_id = student_id;
    if (class_id) query.class_id = class_id;
    const progress = await Progress.find(query).populate('class_id','name').sort({ completed_at: -1 });
    return res.json({ progress });
  } catch { return res.status(500).json({ error: 'Failed to fetch progress' }); }
}

export async function saveProgress(req: AuthRequest, res: Response) {
  try {
    await connectDB(); const u = req.user;
    const { class_id, game_id, game_name, score, max_score } = req.body;
    const progress = new Progress({ student_id: u._id, class_id: class_id || null, game_id, game_name, score, max_score: max_score || 100 });
    await progress.save();
    return res.status(201).json({ message: 'Progress saved successfully', progress });
  } catch { return res.status(500).json({ error: 'Failed to save progress' }); }
}
