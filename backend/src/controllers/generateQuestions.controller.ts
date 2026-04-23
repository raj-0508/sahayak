import * as express from 'express';
import connectDB from '../config/db';
import SubjectMaterial from '../models/SubjectMaterial';
import Content from '../models/Content';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateWithFallback } from '../utils/ai';
import mongoose from 'mongoose';

export async function generateQuestions(req: AuthRequest, res: express.Response) {
  try {
    const u = req.user;
    if (u.user_type !== 'teacher') return res.status(403).json({ error: 'Teacher access required' });
    const { topic, num_questions = 5, question_type = 'mcq', difficulty = 'medium', subject_id, use_rag = false } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    let ragContext = '';
    if (use_rag && subject_id) {
      await connectDB();
      const subjectObjectId = new mongoose.Types.ObjectId(subject_id);
      let materials = await SubjectMaterial.find({ subject_id: subjectObjectId, extracted_text: { $regex: topic, $options: 'i' } }).limit(3);
      if (materials.length === 0) materials = await SubjectMaterial.find({ subject_id: subjectObjectId }).limit(5);
      if (materials.length > 0) ragContext = materials.map((m: any) => { const text = m.extracted_text || ''; const idx = text.toLowerCase().indexOf(topic.toLowerCase()); return idx >= 0 ? text.substring(Math.max(0, idx - 500), Math.min(text.length, idx + 1500)) : text.substring(0, 2000); }).join('\n\n---\n\n');
      let contents = await Content.find({ subject_id: subjectObjectId, $or: [{ title: { $regex: topic, $options: 'i' } }, { content: { $regex: topic, $options: 'i' } }] }).limit(3);
      if (contents.length === 0) contents = await Content.find({ subject_id: subjectObjectId }).limit(3);
      if (contents.length > 0) ragContext += '\n\n---\n\n' + contents.map((c: any) => c.content?.substring(0, 2000) || '').join('\n\n');
    }

    const difficultyGuide: Record<string, string> = { easy: 'simple, straightforward questions for beginners', medium: 'moderate difficulty requiring some understanding', hard: 'challenging questions requiring deep analysis' };
    const typeGuide: Record<string, string> = { mcq: '"question": text, "options": [4 strings], "correct_answer": exact correct option text, "marks": 1', true_false: '"question": a true/false statement, "correct_answer": "True" or "False", "marks": 1', short_answer: '"question": brief answer question, "correct_answer": expected answer, "marks": 2', long_answer: '"question": essay-type question, "correct_answer": key points, "marks": 5' };

    let contextSection = ragContext ? `CURRICULUM CONTEXT:\n${ragContext.substring(0, 6000)}\n\n---\n` : '';
    const prompt = `You are an expert educator creating ${difficulty} difficulty ${question_type.replace('_', ' ')} questions about "${topic}".\n${contextSection}\nGenerate exactly ${num_questions} questions. Difficulty: ${difficultyGuide[difficulty]}.\nFor each question: { ${typeGuide[question_type]} }.\nReturn ONLY valid JSON: { "questions": [...] }. No markdown, no extra text.`;

    const result = await generateWithFallback(prompt, { maxOutputTokens: 4096, temperature: 0.7 });
    let jsonText = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonText);
    const questions = parsed.questions || parsed;
    const formatted = questions.map((q: any) => ({ question: q.question, question_type, options: question_type === 'mcq' ? (q.options || []).slice(0, 4) : question_type === 'true_false' ? ['True', 'False'] : undefined, correct_answer: q.correct_answer || q.answer || '', marks: q.marks || 1 }));
    return res.json({ questions: formatted, used_rag: ragContext.length > 0 });
  } catch (err) {
    console.error('Generate questions error:', err);
    return res.status(500).json({ error: 'Failed to generate questions' });
  }
}
