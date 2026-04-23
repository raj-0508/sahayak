import { Request, Response } from 'express';
import User from '../models/User';
import connectDB from '../config/db';
import { generateToken, setAuthCookie, clearAuthCookie } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth.middleware';

export async function login(req: Request, res: Response) {
  try {
    await connectDB();
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

    const token = generateToken(user);
    setAuthCookie(res, token);

    return res.json({
      message: 'Login successful',
      user: { id: user._id.toString(), name: user.name, email: user.email, user_type: user.user_type, avatar: user.avatar, subject_ids: user.subject_ids?.map((id: any) => id.toString()) || [], phone: user.phone, grade_level: user.grade_level, teaching_grades: user.teaching_grades || [] },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function signup(req: Request, res: Response) {
  try {
    await connectDB();
    const { name, email, password, user_type, phone, subject_ids, grade_level, teaching_grades } = req.body;
    if (!name || !email || !password || !user_type) return res.status(400).json({ error: 'Name, email, password, and user type are required' });
    if (!['student','teacher'].includes(user_type)) return res.status(400).json({ error: 'Invalid user type' });
    if (user_type === 'student' && !grade_level) return res.status(400).json({ error: 'Students must select a grade level' });
    if (user_type === 'teacher' && (!subject_ids || subject_ids.length === 0)) return res.status(400).json({ error: 'Teachers must select at least one subject' });
    if (user_type === 'teacher' && (!teaching_grades || teaching_grades.length === 0)) return res.status(400).json({ error: 'Teachers must select at least one grade level' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'An account with this email already exists' });

    const user = await User.create({
      name, email: email.toLowerCase(), password, user_type, phone: phone || '',
      subject_ids: user_type === 'teacher' ? subject_ids : [],
      grade_level: user_type === 'student' ? grade_level : undefined,
      teaching_grades: user_type === 'teacher' ? teaching_grades : [],
      avatar: '',
    });

    const token = generateToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      message: 'Signup successful',
      user: { id: user._id.toString(), name: user.name, email: user.email, user_type: user.user_type, avatar: user.avatar, grade_level: user.grade_level, teaching_grades: user.teaching_grades },
      token,
    });
  } catch (err: any) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e: any) => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function logout(_req: Request, res: Response) {
  clearAuthCookie(res);
  return res.json({ message: 'Logout successful' });
}

export async function getMe(req: AuthRequest, res: Response) {
  const u = req.user;
  return res.json({
    user: { id: u._id.toString(), name: u.name, email: u.email, user_type: u.user_type, avatar: u.avatar, subject_ids: u.subject_ids?.map((id: any) => id.toString()) || [], phone: u.phone, grade_level: u.grade_level, teaching_grades: u.teaching_grades || [], preferred_language: u.preferred_language || 'English', created_at: u.created_at }
  });
}

export async function updateMe(req: AuthRequest, res: Response) {
  try {
    const { name, phone, grade_level, teaching_grades, preferred_language } = req.body;
    const u = req.user;
    if (name) u.name = name;
    if (phone !== undefined) u.phone = phone;
    if (u.user_type === 'student' && grade_level) u.grade_level = grade_level;
    if (u.user_type === 'teacher' && teaching_grades) u.teaching_grades = teaching_grades;
    if (preferred_language) u.preferred_language = preferred_language;
    await u.save();
    return res.json({ message: 'Profile updated', user: { id: u._id.toString(), name: u.name, email: u.email, user_type: u.user_type, avatar: u.avatar, subject_ids: u.subject_ids?.map((id: any) => id.toString()) || [], phone: u.phone, grade_level: u.grade_level, teaching_grades: u.teaching_grades || [], preferred_language: u.preferred_language || 'English', created_at: u.created_at } });
  } catch (err) {
    console.error('Update me error:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}
