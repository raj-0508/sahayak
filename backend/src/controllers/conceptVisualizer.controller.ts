import * as express from 'express';
import Content from '../models/Content';
import Class from '../models/Class';
import SubjectMaterial from '../models/SubjectMaterial';
import connectDB from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateWithFallback } from '../utils/ai';

export async function conceptVisualizer(req: AuthRequest, res: express.Response) {
  try {
    const u = req.user;
    const { text, topic, useRag } = req.body;
    if (!text && !topic) return res.status(400).json({ error: 'Either text or topic is required' });

    let contentToAnalyze = '';
    let ragSource: string | null = null;

    if (text) {
      contentToAnalyze = `TEXT FROM DOCUMENT:\n${text}`;
      if (topic) {
        contentToAnalyze = `TOPIC: ${topic}\n\n${contentToAnalyze}`;
      }
      ragSource = 'Uploaded Document';
    }

    if (useRag && topic && !text) {
      await connectDB();
      let classIds: string[] = [];
      if (u.user_type === 'student') {
        const enrolled = await Class.find({ students: u._id }).select('_id');
        classIds = enrolled.map((c: any) => c._id.toString());
      } else if (u.user_type === 'teacher') {
        const classes = await Class.find({ teacher_id: u._id }).select('_id');
        classIds = classes.map((c: any) => c._id.toString());
      }

      const searchRegex = new RegExp(topic.split(' ').join('|'), 'i');
      const relevantContent = await Content.find({
        $and: [
          classIds.length > 0 ? { class_id: { $in: classIds } } : {},
          { $or: [{ title: searchRegex }, { content: searchRegex }] }
        ]
      }).sort({ created_at: -1 }).limit(5);

      const relevantMaterials = await SubjectMaterial.find({
        $or: [{ title: searchRegex }, { extracted_text: searchRegex }]
      }).populate('subject_id', 'name').sort({ created_at: -1 }).limit(5);

      if (relevantContent.length + relevantMaterials.length > 0) {
        const pieces: string[] = [];
        relevantContent.forEach((c: any) => pieces.push(`${c.title}:\n${c.content}`));
        relevantMaterials.forEach((m: any) => pieces.push(`${m.title} (${m.subject_id?.name || 'Unknown'}):\n${m.extracted_text.slice(0, 3000)}`));
        contentToAnalyze = pieces.join('\n\n---\n\n');
        ragSource = `Curriculum (${relevantContent.length} notes, ${relevantMaterials.length} materials)`;
      } else {
        contentToAnalyze = `Topic: ${topic}`;
        ragSource = 'AI Knowledge';
      }
    } else if (!text && topic) {
      contentToAnalyze = `Topic: ${topic}`;
    }

    const prompt = `You are an expert educator creating visual concept maps.
Your task is to analyze the provided TEXT/TOPIC and extract core concepts and their relationships.

CRITICAL INSTRUCTION:
1. Use the provided TEXT as your primary source if available.
2. If the text is insufficient, or if only a TOPIC is provided, utilize your extensive general knowledge to create a comprehensive and accurate concept map.
3. Do NOT limit yourself strictly to the provided text if it means missing fundamental concepts related to the topic.
4. Provide a well-structured, educational visualization that helps a student understand the subject deeply.

TEXT/TOPIC CONTENT:
${contentToAnalyze}

Return ONLY valid JSON in this format:
{
  "title": "Main topic name",
  "nodes": [
    {"id": "1", "label": "Concept Name", "description": "Brief 1-2 sentence explanation", "level": 0, "color": "#ef4444"}
  ],
  "edges": [
    {"from": "1", "to": "2", "label": "relationship description", "arrows": "to"}
  ]
}

RULES for Visuals:
- level 0 (Central Concept): color #ef4444 (red)
- level 1 (Main Branches): color #f97316 (orange)
- level 2 (Sub-concepts): color #3b82f6 (blue)
- level 3 (Details): color #22c55e (green)
- Extract 10-15 nodes for a detailed map.
- Node descriptions must be informative.
- Output ONLY the JSON object. No markdown code blocks, no preamble.`;

    const result = await generateWithFallback(prompt, { maxOutputTokens: 4000, temperature: 0.4 });
    let jsonText = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const conceptMap = JSON.parse(jsonText);
      if (!conceptMap.nodes || !Array.isArray(conceptMap.nodes)) throw new Error('Invalid structure');
      return res.json({ conceptMap, ragSource });
    } catch {
      return res.json({ conceptMap: { title: topic || 'Concept Map', nodes: [{ id: '1', label: topic || 'Main Concept', description: 'Central topic', level: 0, color: '#ef4444' }], edges: [] }, ragSource, warning: 'Simplified version shown.' });
    }
  } catch (err) {
    console.error('Concept visualizer error:', err);
    return res.status(500).json({ error: 'Failed to generate concept map.' });
  }
}
