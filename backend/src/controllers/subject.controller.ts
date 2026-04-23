import { Request, Response } from 'express';
import Subject from '../models/Subject';
import connectDB from '../config/db';

export async function getSubjects(_req: Request, res: Response) {
  try { await connectDB(); const subjects = await Subject.find({}).sort({ name: 1 }); return res.json({ subjects }); }
  catch { return res.status(500).json({ error: 'Internal server error' }); }
}
export async function createSubject(req: Request, res: Response) {
  try {
    await connectDB();
    const { name, description, grade_levels, image_url } = req.body;
    if (!name) return res.status(400).json({ error: 'Subject name is required' });
    const subject = await Subject.create({ name, description: description || '', grade_levels: grade_levels || [], image_url: image_url || '' });
    return res.status(201).json({ subject });
  } catch (err: any) {
    if (err.code === 11000) return res.status(400).json({ error: 'A subject with this name already exists' });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
export async function getSubject(req: Request, res: Response) {
  try { await connectDB(); const subject = await Subject.findById(req.params.id); if (!subject) return res.status(404).json({ error: 'Subject not found' }); return res.json({ subject }); }
  catch { return res.status(500).json({ error: 'Internal server error' }); }
}
export async function updateSubject(req: Request, res: Response) {
  try {
    await connectDB();
    const { name, description, grade_levels, image_url } = req.body;
    const u: any = {};
    if (name) u.name = name;
    if (description !== undefined) u.description = description;
    if (grade_levels) u.grade_levels = grade_levels;
    if (image_url !== undefined) u.image_url = image_url;
    const subject = await Subject.findByIdAndUpdate(req.params.id, u, { new: true, runValidators: true });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    return res.json({ subject });
  } catch (err: any) {
    if (err.code === 11000) return res.status(400).json({ error: 'A subject with this name already exists' });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
export async function deleteSubject(req: Request, res: Response) {
  try { await connectDB(); const s = await Subject.findByIdAndDelete(req.params.id); if (!s) return res.status(404).json({ error: 'Subject not found' }); return res.json({ message: 'Subject deleted successfully' }); }
  catch { return res.status(500).json({ error: 'Internal server error' }); }
}
