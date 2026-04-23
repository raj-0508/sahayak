import { Request, Response } from 'express';
import User from '../models/User';
import connectDB from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

export async function getUsers(_req: Request, res: Response) {
  try {
    await connectDB();
    const users = await User.find({}).select('-password').sort({ created_at: -1 });
    return res.json({ users });
  } catch (err) { return res.status(500).json({ error: 'Internal server error' }); }
}

export async function createUser(req: Request, res: Response) {
  try {
    await connectDB();
    const { name, email, password, user_type, phone, subject_ids, grade_level, teaching_grades } = req.body;
    if (!name || !email || !password || !user_type) return res.status(400).json({ error: 'Name, email, password, and user type are required' });
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(400).json({ error: 'An account with this email already exists' });
    const user = await User.create({ name, email: email.toLowerCase(), password, user_type, phone: phone || '', subject_ids: subject_ids || [], grade_level: user_type === 'student' ? grade_level : undefined, teaching_grades: user_type === 'teacher' ? (teaching_grades || []) : [] });
    return res.status(201).json({ user: { id: user._id.toString(), name: user.name, email: user.email, user_type: user.user_type, phone: user.phone, subject_ids: user.subject_ids, grade_level: user.grade_level, teaching_grades: user.teaching_grades, created_at: user.created_at } });
  } catch (err: any) {
    if (err.name === 'ValidationError') return res.status(400).json({ error: Object.values(err.errors).map((e: any) => e.message).join(', ') });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUser(req: Request, res: Response) {
  try {
    await connectDB();
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}

export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const authUser = req.user;
    const isSelf = authUser._id.toString() === id;
    const isAdmin = authUser.user_type === 'admin';
    if (!isSelf && !isAdmin) return res.status(403).json({ error: 'Unauthorized. You can only edit your own profile.' });
    await connectDB();
    const { name, email, phone, user_type, subject_ids, grade_level, teaching_grades } = req.body;
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (phone !== undefined) updateData.phone = phone;
    if (isAdmin) {
      if (user_type) updateData.user_type = user_type;
      if (subject_ids !== undefined) updateData.subject_ids = subject_ids;
      if (grade_level !== undefined) updateData.grade_level = grade_level;
      if (teaching_grades !== undefined) updateData.teaching_grades = teaching_grades;
    }
    await User.findByIdAndUpdate(id, { $set: updateData });
    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (err: any) {
    if (err.code === 11000) return res.status(400).json({ error: 'Email already exists' });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    await connectDB();
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'User deleted successfully' });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}
