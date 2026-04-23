'use server';

/**
 * @fileOverview A flow to generate differentiated worksheets for students with varying difficulty levels and in multiple languages.
 *
 * - generateDifferentiatedWorksheets - A function that generates differentiated worksheets.
 * - GenerateDifferentiatedWorksheetsInput - The input type for the generateDifferentiatedWorksheets function.
 * - GenerateDifferentiatedWorksheetsOutput - The return type for the generateDifferentiatedWorksheets function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDifferentiatedWorksheetsInputSchema = z.object({
  topic: z.string().describe('The topic of the worksheet.'),
  language: z.string().describe('The language of the worksheet. Supported languages are Hindi, Tamil, Telugu, and English.'),
  difficultyLevels: z.number().int().min(1).max(3).describe('The number of difficulty levels to generate. Must be between 1 and 3.'),
  studentLevel: z.string().describe('The current level the student is at. For example, beginner, intermediate, or advanced.'),
});
export type GenerateDifferentiatedWorksheetsInput = z.infer<typeof GenerateDifferentiatedWorksheetsInputSchema>;

const GenerateDifferentiatedWorksheetsOutputSchema = z.object({
  worksheets: z.array(z.string()).describe('An array of differentiated worksheets in the specified language.'),
});
export type GenerateDifferentiatedWorksheetsOutput = z.infer<typeof GenerateDifferentiatedWorksheetsOutputSchema>;

export async function generateDifferentiatedWorksheets(
  input: GenerateDifferentiatedWorksheetsInput
): Promise<GenerateDifferentiatedWorksheetsOutput> {
  return generateDifferentiatedWorksheetsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDifferentiatedWorksheetsPrompt',
  input: {schema: GenerateDifferentiatedWorksheetsInputSchema},
  output: {schema: GenerateDifferentiatedWorksheetsOutputSchema},
  prompt: `You are an expert teacher specializing in creating differentiated worksheets for students with varying learning needs.

You will generate {{difficultyLevels}} worksheets on the topic of {{topic}} in {{language}}. The worksheets should be differentiated based on the student's current level, which is {{studentLevel}}.

Each worksheet should be tailored to a different difficulty level, ranging from beginner to advanced. The worksheets should be engaging and appropriate for the specified language and topic.

Format each worksheet as a distinct string within the worksheets array.

Output worksheets in format that is easy to copy and paste into a document editor.
`,
});

const generateDifferentiatedWorksheetsFlow = ai.defineFlow(
  {
    name: 'generateDifferentiatedWorksheetsFlow',
    inputSchema: GenerateDifferentiatedWorksheetsInputSchema,
    outputSchema: GenerateDifferentiatedWorksheetsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
