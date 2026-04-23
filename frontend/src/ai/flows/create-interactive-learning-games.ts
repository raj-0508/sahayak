'use server';
/**
 * @fileOverview This file defines a Genkit flow for creating interactive learning games.
 *
 * The flow takes a description of the game, the subject, and the student's progress
 * as input, and returns the game content as output.
 *
 * @interface CreateInteractiveLearningGamesInput - Input type for the createInteractiveLearningGames function.
 * @interface CreateInteractiveLearningGamesOutput - Output type for the createInteractiveLearningGames function.
 * @function createInteractiveLearningGames - The function that handles the creation of interactive learning games.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateInteractiveLearningGamesInputSchema = z.object({
  topic: z.string().describe('The specific topic for the learning game.'),
  subject: z.string().describe('The subject area (e.g., Science, Math, History).'),
  gradeLevel: z.string().describe('The grade level of the student.'),
  gameType: z
    .string()
    .describe(
      'The type of interactive learning game to create (e.g., memory, quiz, word).'
    ),
  difficultyLevel: z
    .string()
    .default('medium')
    .describe('The difficulty level (easy, medium, hard).'),
  language: z
    .string()
    .default('English')
    .describe('The language for the game content (e.g., English, Hindi, Tamil, Telugu).'),
});
export type CreateInteractiveLearningGamesInput = z.infer<
  typeof CreateInteractiveLearningGamesInputSchema
>;

const CreateInteractiveLearningGamesOutputSchema = z.object({
  gameContent: z
    .string()
    .describe(
      'The content of the interactive learning game, formatted as a string that can be rendered by the application.'
    ),
});
export type CreateInteractiveLearningGamesOutput = z.infer<
  typeof CreateInteractiveLearningGamesOutputSchema
>;

export async function createInteractiveLearningGames(
  input: CreateInteractiveLearningGamesInput
): Promise<CreateInteractiveLearningGamesOutput> {
  return createInteractiveLearningGamesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createInteractiveLearningGamesPrompt',
  input: {schema: CreateInteractiveLearningGamesInputSchema},
  output: {schema: CreateInteractiveLearningGamesOutputSchema},
  prompt: `You are an AI assistant designed to create interactive learning games for students.

Create a {{gameType}} game about "{{topic}}" for {{subject}} at {{gradeLevel}} level.
Difficulty: {{difficultyLevel}}
Language: {{language}}

IMPORTANT: You must output valid JSON only. No markdown, no explanations, just the JSON object.

For quiz games, output this exact JSON structure:
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}
Generate 5-8 questions for a quiz.

For memory games, output this exact JSON structure:
{
  "pairs": [
    {
      "term": "Term or concept",
      "definition": "Short definition or match"
    }
  ]
}
Generate 6-8 pairs for a memory game. Keep terms and definitions short (under 30 characters).

For word games, output this exact JSON structure:
{
  "words": [
    {
      "word": "VOCABULARY",
      "hint": "A hint for the word",
      "category": "Category name"
    }
  ]
}

Make the content culturally relevant and age-appropriate for Indian students.
Output ONLY the JSON, nothing else:`,
});

const createInteractiveLearningGamesFlow = ai.defineFlow(
  {
    name: 'createInteractiveLearningGamesFlow',
    inputSchema: CreateInteractiveLearningGamesInputSchema,
    outputSchema: CreateInteractiveLearningGamesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
