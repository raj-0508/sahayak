import { Response } from 'express';
import connectDB from '../config/db';
import SubjectMaterial from '../models/SubjectMaterial';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateWithFallback } from '../utils/ai';

export async function generateContent(req: AuthRequest, res: Response) {
  try {
    const u = req.user;
    if (u.user_type !== 'teacher') return res.status(403).json({ error: 'Teacher access required' });
    const { topic, content_type = 'explanation', language = 'English', grade_level = '6-8', cultural_context = '', additional_instructions = '', subject_id = '' } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    let ragContext = '';
    if (subject_id && subject_id !== 'general') {
      await connectDB();
      const materials = await SubjectMaterial.find({ subject_id, extracted_text: { $regex: topic, $options: 'i' } }).limit(3);
      if (materials.length > 0) ragContext = materials.map((m: any) => { const text = m.extracted_text || ''; const idx = text.toLowerCase().indexOf(topic.toLowerCase()); return idx >= 0 ? text.substring(Math.max(0, idx - 500), Math.min(text.length, idx + 1500)) : text.substring(0, 2000); }).join('\n\n---\n\n');
    }

    const gradeLevelGuide: Record<string, string> = { '1-3': 'Very simple, max 200 words.', '4-5': 'Simple, max 300 words.', '6-8': 'Moderate, max 500 words.', '9-10': 'Detailed, max 700 words.', '11-12': 'Advanced, max 1000 words.' };
    const contentTypeGuide: Record<string, string> = { lesson_plan: 'Create a structured lesson plan with objectives, introduction, main content, activities, assessment, and conclusion.', explanation: 'Provide a clear explanation with intro, key points, examples, and summary.', story: 'Create an educational story with relatable characters.', quiz: 'Create 5-8 questions with answers.', summary: 'Provide concise summary with key points and important terms.' };

    let prompt = `You are an expert Indian educator creating ${content_type.replace('_', ' ')} about "${topic}". TARGET: ${grade_level} students. LANGUAGE: ${language}.\n${gradeLevelGuide[grade_level] || gradeLevelGuide['6-8']}\n${contentTypeGuide[content_type] || contentTypeGuide.explanation}`;
    if (ragContext) prompt += `\n\nCURRICULUM REFERENCE:\n---\n${ragContext}\n---\nBase content primarily on the curriculum material above.`;
    if (cultural_context) prompt += `\n\nCULTURAL CONTEXT: Incorporate references to ${cultural_context}.`;
    if (additional_instructions) prompt += `\n\nADDITIONAL: ${additional_instructions}`;
    prompt += `\n\nIMPORTANT: Write in ${language}, age-appropriate, engaging. Do NOT use markdown (no ** or *). Generate content now:`;

    const result = await generateWithFallback(prompt, { maxOutputTokens: 4096, temperature: 0.8 });
    let content = result.text.replace(/\*\*/g, '').replace(/\*/g, '').trim();
    return res.json({ content, used_curriculum: ragContext.length > 0 });
  } catch (err) {
    console.error('Generate content error:', err);
    return res.status(500).json({ error: 'Failed to generate content' });
  }
}
