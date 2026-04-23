import { Request, Response } from 'express';
import Log from '../models/Log';
import connectDB from '../config/db';

export async function getLogs(req: Request, res: Response) {
  try {
    await connectDB();
    const limit = parseInt(req.query.limit as string || '100');
    const skip = parseInt(req.query.skip as string || '0');
    const action = req.query.action as string;
    const level = req.query.level as string;
    const query: any = {};
    if (action) query.action = action;
    if (level) query.level = level;
    const logs = await Log.find(query).populate('user_id','name email').sort({ timestamp: -1 }).limit(limit).skip(skip);
    const total = await Log.countDocuments(query);
    return res.json({ logs, total, hasMore: skip + logs.length < total });
  } catch { return res.status(500).json({ error: 'Failed to fetch logs' }); }
}

export async function createLog(req: Request, res: Response) {
  try {
    await connectDB();
    const { user_id, action, level, message } = req.body;
    const log = new Log({ user_id, action, level: level || 'INFO', message });
    await log.save();
    return res.status(201).json({ message: 'Log created', log });
  } catch { return res.status(500).json({ error: 'Failed to create log' }); }
}
