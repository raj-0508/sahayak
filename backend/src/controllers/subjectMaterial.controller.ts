import { Request, Response } from 'express';
import SubjectMaterial from '../models/SubjectMaterial';
import Subject from '../models/Subject';
import User from '../models/User';
import connectDB from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || '');

export async function getMaterials(req: AuthRequest, res: Response) {
  try {
    await connectDB(); const u = req.user;
    const subjectId = req.query.subject_id as string;
    let query: any = {};
    if (subjectId) query.subject_id = subjectId;
    if (u.user_type === 'teacher') {
      const teacher = await User.findById(u._id);
      if (teacher && teacher.subject_ids.length > 0) query.subject_id = { $in: teacher.subject_ids };
      else return res.json({ materials: [] });
    }
    const materials = await SubjectMaterial.find(query).populate('subject_id', 'name').populate('uploaded_by', 'name').sort({ created_at: -1 });
    return res.json({ materials });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}

export async function uploadMaterial(req: AuthRequest, res: Response) {
  try {
    const u = req.user;
    if (!['admin', 'teacher'].includes(u.user_type)) return res.status(403).json({ error: 'Only admins and teachers can upload materials' });
    if (!req.file) return res.status(400).json({ error: 'File is required' });
    await connectDB();
    const { title, description, subject_id, grade_level } = req.body;
    if (!title || !subject_id) return res.status(400).json({ error: 'File, title, and subject are required' });
    if (req.file.mimetype !== 'application/pdf') return res.status(400).json({ error: 'Only PDF files are allowed' });
    const subject = await Subject.findById(subject_id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    if (u.user_type === 'teacher') {
      const teacher = await User.findById(u._id);
      if (!teacher || !teacher.subject_ids.map((id: any) => id.toString()).includes(subject_id)) return res.status(403).json({ error: 'You can only upload materials for your assigned subjects' });
    }
    const base64PDF = req.file.buffer.toString('base64');
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
    const result = await model.generateContent([{ text: 'Extract all the text accurately from this PDF. Maintain paragraph structures. Do not add any conversational responses, just output the exact text.' }, { inlineData: { data: base64PDF, mimeType: 'application/pdf' } }]);
    let extractedText = result.response.text() || '';
    extractedText = extractedText.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/\s{3,}/g, '  ').trim();
    if (!extractedText || extractedText.length < 50) return res.status(400).json({ error: 'Could not extract meaningful text from PDF.' });
    const material = await SubjectMaterial.create({ subject_id, title, description: description || '', file_name: req.file.originalname, file_type: req.file.mimetype, file_size: req.file.size, extracted_text: extractedText, grade_level: grade_level || '', uploaded_by: u._id });
    const populated = await SubjectMaterial.findById(material._id).populate('subject_id', 'name').populate('uploaded_by', 'name');
    return res.status(201).json({ material: populated, message: 'Material uploaded successfully', wordCount: extractedText.split(/\s+/).length });
  } catch (err: any) {
    if (err.name === 'ValidationError') return res.status(400).json({ error: Object.values(err.errors).map((e: any) => e.message).join(', ') });
    console.error('Upload material error:', err);
    return res.status(500).json({ error: `Failed to upload: ${err.message || 'Unknown error'}` });
  }
}

export async function getMaterial(req: AuthRequest, res: Response) {
  try {
    await connectDB();
    const material = await SubjectMaterial.findById(req.params.id).populate('subject_id', 'name').populate('uploaded_by', 'name');
    if (!material) return res.status(404).json({ error: 'Material not found' });
    return res.json({ material });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}

export async function deleteMaterial(req: AuthRequest, res: Response) {
  try {
    const u = req.user;
    if (!['admin', 'teacher'].includes(u.user_type)) return res.status(403).json({ error: 'Unauthorized' });
    await connectDB();
    const material = await SubjectMaterial.findById(req.params.id);
    if (!material) return res.status(404).json({ error: 'Material not found' });
    if (u.user_type === 'teacher') {
      const teacher = await User.findById(u._id);
      const isOwn = material.uploaded_by.toString() === u._id.toString();
      const isAssigned = teacher?.subject_ids.map((id: any) => id.toString()).includes(material.subject_id.toString());
      if (!isOwn || !isAssigned) return res.status(403).json({ error: 'You can only delete your own materials for your assigned subjects' });
    }
    await SubjectMaterial.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Material deleted successfully' });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}
