'use server';
/**
 * @fileOverview An AI agent that generates visual aids for teachers.
 *
 * - generateVisualAid - A function that generates visual aids based on the teacher's request.
 * - GenerateVisualAidInput - The input type for the generateVisualAid function.
 * - GenerateVisualAidOutput - The return type for the generateVisualAid function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVisualAidInputSchema = z.object({
  topic: z.string().describe('The topic for which the visual aid is needed.'),
  type: z
    .enum(['line drawing', 'chart', 'blackboard explanation'])
    .describe('The type of visual aid to generate.'),
  details: z.string().describe('Additional details or specifications for the visual aid.'),
});
export type GenerateVisualAidInput = z.infer<typeof GenerateVisualAidInputSchema>;

const GenerateVisualAidOutputSchema = z.object({
  visualAidDataUri: z.string().describe(
    'The generated visual aid as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // data URI
  ),
});
export type GenerateVisualAidOutput = z.infer<typeof GenerateVisualAidOutputSchema>;

export async function generateVisualAid(input: GenerateVisualAidInput): Promise<GenerateVisualAidOutput> {
  return generateVisualAidFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateVisualAidPrompt',
  input: {schema: GenerateVisualAidInputSchema},
  output: {schema: GenerateVisualAidOutputSchema},
  prompt: `You are an AI assistant that helps teachers generate visual aids for their lessons.

  The teacher is requesting a visual aid of type "{{type}}" for the topic "{{topic}}".  Additional details are provided as "{{details}}".

  Generate a visual aid that meets the teacher's specifications.  The visual aid should be simple, easy to understand, and appropriate for the classroom.

  Return the visual aid as a data URI.
  `,
});

const generateVisualAidFlow = ai.defineFlow(
  {
    name: 'generateVisualAidFlow',
    inputSchema: GenerateVisualAidInputSchema,
    outputSchema: GenerateVisualAidOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: `Generate a ${input.type} about ${input.topic} with the following details: ${input.details}. The visual aid should be suitable for educational purposes.`, // Text to image prompt
    });
    if (!media) {
      throw new Error('No media was generated.');
    }
    return {visualAidDataUri: media.url!};
  }
);
