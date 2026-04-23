import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateWithFallback } from '../utils/ai';

export async function analyzeContent(req: AuthRequest, res: Response) {
  try {
    const u = req.user;
    if (u.user_type !== 'teacher') return res.status(403).json({ error: 'Teacher access required' });
    const { text } = req.body;
    if (!text || text.trim().length < 100) return res.status(400).json({ error: 'Text content is too short for analysis.' });

    const prompt = `You are an expert educational content analyst. Analyze this content and return ONLY a valid JSON object:
{"difficulty":"Easy"|"Medium"|"Hard","topics":["topic1","topic2","topic3"],"keyPoints":["point1","point2","point3","point4","point5"],"suggestions":["suggestion1","suggestion2","suggestion3","suggestion4"]}

CONTENT TO ANALYZE:
${text.slice(0, 10000)}

Return ONLY the JSON object, no markdown.`;

    const result = await generateWithFallback(prompt, { maxOutputTokens: 2048, temperature: 0.3 });
    let jsonText = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      const analysis = JSON.parse(jsonText);
      return res.json({ analysis: { difficulty: analysis.difficulty || 'Medium', topics: (analysis.topics || []).slice(0, 5), keyPoints: (analysis.keyPoints || []).slice(0, 5), suggestions: (analysis.suggestions || []).slice(0, 4) } });
    } catch {
      return res.json({ analysis: { difficulty: 'Medium', topics: ['General topic'], keyPoints: ['Content extracted'], suggestions: ['Review manually'] } });
    }
  } catch (err) {
    console.error('Analyze content error:', err);
    return res.status(500).json({ error: 'Failed to analyze content' });
  }
}
