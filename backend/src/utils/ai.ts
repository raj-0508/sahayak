import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';

const API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

const DEFAULT_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro-latest'
];

export async function generateWithFallback(prompt: string, config: GenerationConfig = {}) {
  let lastError: any = null;

  // Use the model from .env if specified, then follow with default list
  const envModel = process.env.GEMINI_MODEL;
  const modelsToTry = Array.from(new Set([
    ...(envModel ? [envModel] : []),
    ...DEFAULT_MODELS
  ]));

  for (const modelName of modelsToTry) {
    try {
      console.log(`[AI] Attempting generation with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
          ...config
        }
      });
      
      const response = await result.response;
      console.log(`[AI] Successfully generated with model: ${modelName}`);
      return {
        text: response.text(),
        model: modelName
      };
    } catch (err: any) {
      console.error(`[AI] Error with model ${modelName}:`, err.message);
      lastError = err;
      
      // Check for specific retryable errors
      const isRetryable = 
        err.message?.includes('429') || 
        err.message?.includes('quota') || 
        err.message?.includes('404') || 
        err.message?.includes('not found') ||
        err.message?.includes('503') ||
        err.message?.includes('overloaded');

      if (isRetryable) {
        console.log(`[AI] Model ${modelName} failed with retryable error. Trying next...`);
        continue;
      }
      
      // If it's a structural error (like safety settings), we might want to try next too
      console.log(`[AI] Model ${modelName} failed. Trying next...`);
      continue;
    }
  }

  throw lastError || new Error('All configured AI models failed to provide a response.');
}
