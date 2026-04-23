'use server';
/**
 * @fileOverview A flow that generates culturally relevant educational content in multiple local languages.
 *
 * - generateCulturallyRelevantContent - A function that handles the content generation process.
 * - GenerateCulturallyRelevantContentInput - The input type for the generateCulturallyRelevantContent function.
 * - GenerateCulturallyRelevantContentOutput - The return type for the generateCulturallyRelevantContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCulturallyRelevantContentInputSchema = z.object({
  topic: z.string().describe('The topic of the educational content.'),
  language: z.string().describe('The target language for the content.'),
  culture: z.string().describe('The cultural context for the content.'),
  gradeLevel: z.string().describe('The grade level of the students.'),
  contentType: z.string().describe('The type of content to generate (e.g., story, worksheet, quiz).'),
});
export type GenerateCulturallyRelevantContentInput = z.infer<typeof GenerateCulturallyRelevantContentInputSchema>;

const GenerateCulturallyRelevantContentOutputSchema = z.object({
  content: z.string().describe('The generated culturally relevant educational content.'),
});
export type GenerateCulturallyRelevantContentOutput = z.infer<typeof GenerateCulturallyRelevantContentOutputSchema>;

export async function generateCulturallyRelevantContent(input: GenerateCulturallyRelevantContentInput): Promise<GenerateCulturallyRelevantContentOutput> {
  return generateCulturallyRelevantContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCulturallyRelevantContentPrompt',
  input: {schema: GenerateCulturallyRelevantContentInputSchema},
  output: {schema: GenerateCulturallyRelevantContentOutputSchema},
  prompt: `You are an expert in creating culturally relevant educational content for students.

  Please generate {{contentType}} about {{topic}} for {{gradeLevel}} students in {{language}}, making sure it is relevant to {{culture}}.

  Make sure the content is accurate, engaging, and appropriate for the specified grade level and cultural context.

  Output:
  {{contentType}}:`,
});

const generateCulturallyRelevantContentFlow = ai.defineFlow(
  {
    name: 'generateCulturallyRelevantContentFlow',
    inputSchema: GenerateCulturallyRelevantContentInputSchema,
    outputSchema: GenerateCulturallyRelevantContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
