import * as express from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || '');

export async function extractPdf(req: AuthRequest & { file?: Express.Multer.File }, res: express.Response) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    if (req.file.mimetype !== 'application/pdf') return res.status(400).json({ error: 'File must be a PDF' });

    const base64PDF = req.file.buffer.toString('base64');
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
    const result = await model.generateContent([{ text: 'Extract all the text accurately from this PDF. Maintain paragraph structures. Do not add any conversational responses, just output the exact text.' }, { inlineData: { data: base64PDF, mimeType: 'application/pdf' } }]);
    let extractedText = result.response.text() || '';
    extractedText = extractedText.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/\s{3,}/g, '  ').trim();
    if (!extractedText || extractedText.trim().length < 50) return res.status(400).json({ error: 'Could not extract meaningful text from PDF.' });
    if (extractedText.length > 15000) extractedText = extractedText.slice(0, 15000);
    const wordCount = extractedText.split(/\s+/).filter((w: string) => w.length > 0).length;
    return res.json({ text: extractedText, wordCount });
  } catch (err: any) {
    console.error('PDF extraction error:', err);
    return res.status(500).json({ error: `Failed to extract text: ${err.message || 'Unknown error'}` });
  }
}
