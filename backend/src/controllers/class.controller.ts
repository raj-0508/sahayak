import { Request, Response } from 'express';
import Class from '../models/Class';
import Subject from '../models/Subject';
import JoinRequest from '../models/JoinRequest';
import connectDB from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import mongoose from 'mongoose';

export async function getClasses(req: AuthRequest, res: Response) {
  try {
    const u = req.user; await connectDB();
    let classes;
    if (u.user_type === 'admin') classes = await Class.find({}).populate('subject_id','name description').populate('teacher_id','name email').sort({ created_at: -1 });
    else if (u.user_type === 'teacher') classes = await Class.find({ teacher_id: u._id }).populate('subject_id','name description').populate('students','name email grade_level').sort({ created_at: -1 });
    else classes = await Class.find({ students: u._id }).populate('subject_id','name description').populate('teacher_id','name email').sort({ created_at: -1 });
    return res.json({ classes });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}

export async function getAvailableClasses(req: AuthRequest, res: Response) {
  try {
    await connectDB(); const u = req.user;
    const pendingRequests = await JoinRequest.find({ student_id: u._id, status: 'pending' }).select('class_id');
    const pendingClassIds = pendingRequests.map((r: any) => r.class_id);
    const classes = await Class.find({ students: { $ne: u._id }, _id: { $nin: pendingClassIds } }).populate('subject_id','name description').populate('teacher_id','name email teaching_grades').sort({ created_at: -1 });
    return res.json({ classes });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}

export async function createClass(req: AuthRequest, res: Response) {
  try {
    const u = req.user;
    if (u.user_type !== 'teacher') return res.status(403).json({ error: 'Teacher access required' });
    await connectDB();
    const { subject_id, class_name, description, grade_level } = req.body;
    if (!subject_id || !class_name || !grade_level) return res.status(400).json({ error: 'Subject ID, class name, and grade level are required' });
    const gradeNum = parseInt(grade_level);
    if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 12) return res.status(400).json({ error: 'Grade level must be between 1 and 12' });
    const subject = await Subject.findById(subject_id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    const newClass = await Class.create({ teacher_id: u._id, teacher_name: u.name, subject_id, class_name, description: description || '', grade_level: gradeNum, students: [] });
    const populated = await Class.findById(newClass._id).populate('subject_id','name description');
    return res.status(201).json({ class: populated });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}

export async function getClass(req: AuthRequest, res: Response) {
  try {
    await connectDB();
    const classData = await Class.findById(req.params.id).populate('subject_id','name description').populate('teacher_id','name email').populate('students','name email');
    if (!classData) return res.status(404).json({ error: 'Class not found' });
    return res.json({ class: classData });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}

export async function updateClass(req: AuthRequest, res: Response) {
  try {
    await connectDB(); const u = req.user;
    const classData = await Class.findById(req.params.id);
    if (!classData) return res.status(404).json({ error: 'Class not found' });
    if (classData.teacher_id.toString() !== u._id.toString() && u.user_type !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    const { class_name, description } = req.body;
    const updateData: any = {};
    if (class_name) updateData.class_name = class_name;
    if (description !== undefined) updateData.description = description;
    const updated = await Class.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).populate('subject_id','name description');
    return res.json({ class: updated });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}

export async function deleteClass(req: AuthRequest, res: Response) {
  try {
    await connectDB(); const u = req.user;
    const classData = await Class.findById(req.params.id);
    if (!classData) return res.status(404).json({ error: 'Class not found' });
    if (classData.teacher_id.toString() !== u._id.toString() && u.user_type !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    await Class.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Class deleted successfully' });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}
