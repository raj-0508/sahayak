import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import connectDB from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'sahayak-super-secret-key';

export interface AuthRequest extends Request {
  user?: any;
}

export async function protect(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.['auth-token']) {
      token = req.cookies['auth-token'];
    }
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const decoded: any = jwt.verify(token, JWT_SECRET);
    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.user_type !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

export function requireTeacher(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.user_type !== 'teacher') return res.status(403).json({ error: 'Teacher access required' });
  next();
}

export function requireStudent(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.user_type !== 'student') return res.status(403).json({ error: 'Student access required' });
  next();
}
