import { Request, Response } from 'express';
import JoinRequest from '../models/JoinRequest';
import Class from '../models/Class';
import connectDB from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

export async function getJoinRequests(req: AuthRequest, res: Response) {
  try {
    await connectDB(); const u = req.user; let requests;
    if (u.user_type === 'teacher') requests = await JoinRequest.find({ teacher_id: u._id }).populate('student_id','name email grade_level').populate('subject_id','name').populate('class_id','class_name grade_level').sort({ created_at: -1 });
    else if (u.user_type === 'student') requests = await JoinRequest.find({ student_id: u._id }).populate('teacher_id','name email').populate('subject_id','name').populate('class_id','class_name grade_level').sort({ created_at: -1 });
    else requests = await JoinRequest.find({}).populate('student_id','name email grade_level').populate('teacher_id','name email').populate('subject_id','name').populate('class_id','class_name grade_level').sort({ created_at: -1 });
    return res.json({ requests });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}

export async function createJoinRequest(req: AuthRequest, res: Response) {
  try {
    const u = req.user;
    if (u.user_type !== 'student') return res.status(403).json({ error: 'Student access required' });
    await connectDB();
    const { class_id } = req.body;
    if (!class_id) return res.status(400).json({ error: 'Class ID is required' });
    const classData = await Class.findById(class_id);
    if (!classData) return res.status(404).json({ error: 'Class not found' });
    if (classData.students.includes(u._id)) return res.status(400).json({ error: 'You are already enrolled in this class' });
    const existing = await JoinRequest.findOne({ student_id: u._id, class_id, status: 'pending' });
    if (existing) return res.status(400).json({ error: 'You already have a pending request for this class' });
    const joinRequest = await JoinRequest.create({ student_id: u._id, teacher_id: classData.teacher_id, subject_id: classData.subject_id, class_id, student_name: u.name, student_email: u.email, status: 'pending' });
    return res.status(201).json({ request: joinRequest });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}

export async function handleJoinRequest(req: AuthRequest, res: Response) {
  try {
    const u = req.user;
    if (u.user_type !== 'teacher') return res.status(403).json({ error: 'Teacher access required' });
    await connectDB();
    const { action } = req.body;
    if (!action || !['accept','reject'].includes(action)) return res.status(400).json({ error: 'Action must be accept or reject' });
    const joinRequest = await JoinRequest.findById(req.params.id);
    if (!joinRequest) return res.status(404).json({ error: 'Join request not found' });
    if (joinRequest.teacher_id.toString() !== u._id.toString()) return res.status(403).json({ error: 'This request is not for your class' });
    if (joinRequest.status !== 'pending') return res.status(400).json({ error: 'This request has already been processed' });
    if (action === 'accept') { await Class.findByIdAndUpdate(joinRequest.class_id, { $addToSet: { students: joinRequest.student_id } }); joinRequest.status = 'accepted'; }
    else joinRequest.status = 'rejected';
    await joinRequest.save();
    return res.json({ message: `Request ${action}ed successfully`, request: joinRequest });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}

export async function deleteJoinRequest(req: AuthRequest, res: Response) {
  try {
    await connectDB(); const u = req.user;
    const joinRequest = await JoinRequest.findById(req.params.id);
    if (!joinRequest) return res.status(404).json({ error: 'Join request not found' });
    const isStudent = joinRequest.student_id.toString() === u._id.toString();
    const isTeacher = joinRequest.teacher_id.toString() === u._id.toString();
    const isAdmin = u.user_type === 'admin';
    if (!isStudent && !isTeacher && !isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    if (isStudent && joinRequest.status !== 'pending') return res.status(400).json({ error: 'You can only cancel pending requests' });
    await JoinRequest.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Request deleted successfully' });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}
