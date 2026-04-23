import { Response } from 'express';
import Content from '../models/Content';
import Class from '../models/Class';
import SubjectMaterial from '../models/SubjectMaterial';
import connectDB from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateWithFallback } from '../utils/ai';

const GEMINI_KEY = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || '';

function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  const intersection = words1.filter(w => words2.has(w)).length;
  return intersection / Math.max(words1.length, 1);
}

export async function askGanesha(req: AuthRequest, res: Response) {
  try {
    const u = req.user;
    if (!GEMINI_KEY) return res.status(503).json({ error: 'Gemini API key not configured' });
    await connectDB();
    const { question, language = 'English', grade_level } = req.body;
    if (!question || question.trim().length === 0) return res.status(400).json({ error: 'Question is required' });

    let classIds: string[] = [];
    if (u.user_type === 'student') {
      const enrolled = await Class.find({ students: u._id }).select('_id');
      classIds = enrolled.map((c: any) => c._id.toString());
    } else {
      const classes = await Class.find(u.user_type === 'teacher' ? { teacher_id: u._id } : {}).select('_id');
      classIds = classes.map((c: any) => c._id.toString());
    }

    const allContent = await Content.find({ $or: [{ class_id: { $in: classIds } }, { content_type: 'note' }, { content_type: 'worksheet' }] }).select('title content content_type');
    const materialQuery: any = {};
    if (grade_level) materialQuery.$or = [{ grade_level }, { grade_level: '' }, { grade_level: { $exists: false } }];
    const allMaterials = await SubjectMaterial.find(materialQuery).populate('subject_id', 'name').select('title extracted_text subject_id grade_level');

    const scoredContent: Array<{ title: string; content: string; score: number; source: string }> = [];
    allContent.forEach((doc: any) => scoredContent.push({ title: doc.title, content: doc.content, score: calculateSimilarity(question, `${doc.title} ${doc.content}`), source: 'content' }));
    allMaterials.forEach((doc: any) => { const subjectName = doc.subject_id?.name || 'Unknown'; scoredContent.push({ title: `${doc.title} (${subjectName})`, content: doc.extracted_text.slice(0, 5000), score: calculateSimilarity(question, `${doc.title} ${subjectName} ${doc.extracted_text.slice(0, 2000)}`), source: 'material' }); });

    scoredContent.sort((a, b) => b.score - a.score);
    const relevantContext = scoredContent.slice(0, 5).filter(c => c.score > 0.1).map(c => `Title: ${c.title}\nContent: ${c.content.substring(0, 1000)}`).join('\n\n---\n\n');

    const gradeNum = parseInt(grade_level) || 5;
    let complexityGuidance = gradeNum <= 3 ? 'Very simple language for young learners (Grades 1-3)' : gradeNum <= 5 ? 'Simple clear language (Grades 4-5)' : gradeNum <= 8 ? 'Moderate complexity (Grades 6-8)' : 'Advanced academic language (Grades 9-12)';

    // Flexible RAG: Prioritize materials, but allow general knowledge to be helpful.
    const systemPrompt = `You are Lord Ganesha, a wise and patient mentor for students in rural India.

Your goal is to help students learn effectively by providing accurate and encouraging guidance.

GUIDELINES:
1. CURRICULUM FIRST: If "CURRICULUM CONTEXT" is provided below, treat it as your primary source of truth. Use the exact books and notes the teacher has provided.
2. GENERAL KNOWLEDGE: If the provided context is missing or doesn't fully answer the student's question, use your vast general wisdom to provide a complete and accurate educational answer. 
3. DISCLAIMER: If you are answering without any specific curriculum context, gently mention that your teacher hasn't uploaded specific books on this yet, so you are sharing your general wisdom.
4. TONE: Be warm, wise, and encouraging. Address the student as "Dear child" or "Young one".
5. ANALOGIES: Use simple analogies from Indian daily life (farming, seasons, festivals, village community).
6. FORMATTING: Do NOT use markdown bolding (**) or italics (*). Use plain text. Use plain numbered lists only for steps.
7. COMPLEXITY: Adjust your language for Grade ${gradeNum}: ${complexityGuidance}.
8. LANGUAGE: Always respond in ${language}.

${relevantContext ? `CURRICULUM CONTEXT (Teacher's Material):\n${relevantContext}` : "NOTE: No specific teacher-uploaded materials were found for this topic."}

Now, answer the student's question wisely.`;

    const result = await generateWithFallback(`${systemPrompt}\n\nStudent's Question: ${question}`, { maxOutputTokens: 2048, temperature: 0.7 });
    let answer = result.text;
    answer = answer.replace(/\*\*\*(.*?)\*\*\*/g, '$1').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/^[\s]*[-•]\s*/gm, '• ').replace(/_{2,}/g, '').trim();

    return res.json({ answer, sources: scoredContent.slice(0, 3).filter(c => c.score > 0.1).map(c => c.title), language });
  } catch (err: any) {
    console.error('Ask Ganesha error:', err);
    return res.status(500).json({ error: `Failed to get response: ${err?.message || 'Unknown error'}` });
  }
}
