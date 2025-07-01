'use server';

/**
 * @fileOverview Analyzes motivational drivers in user-provided text.
 *
 * - analyzeMotivationalDrivers - Function to analyze text and identify motivational drivers.
 * - AnalyzeMotivationalDriversInput - Input type for the analyzeMotivationalDrivers function.
 * - AnalyzeMotivationalDriversOutput - Output type for the analyzeMotivationalDrivers function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeMotivationalDriversInputSchema = z.object({
  text: z.string().describe('The text to analyze for motivational drivers.'),
});
export type AnalyzeMotivationalDriversInput = z.infer<typeof AnalyzeMotivationalDriversInputSchema>;

const AnalyzeMotivationalDriversOutputSchema = z.object({
  motivations: z
    .array(z.string())
    .describe('List of motivational drivers identified in the text.'),
  summary: z.string().describe('A brief summary of the motivational drivers.'),
});
export type AnalyzeMotivationalDriversOutput = z.infer<typeof AnalyzeMotivationalDriversOutputSchema>;

export async function analyzeMotivationalDrivers(
  input: AnalyzeMotivationalDriversInput
): Promise<AnalyzeMotivationalDriversOutput> {
  return analyzeMotivationalDriversFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeMotivationalDriversPrompt',
  input: {schema: AnalyzeMotivationalDriversInputSchema},
  output: {schema: AnalyzeMotivationalDriversOutputSchema},
  prompt: `You are an AI expert in analyzing text for motivational drivers.

  Analyze the following text and identify the motivational drivers present. Provide a list of the motivations and a brief summary.

  Text: {{{text}}}
  `,
});

const analyzeMotivationalDriversFlow = ai.defineFlow(
  {
    name: 'analyzeMotivationalDriversFlow',
    inputSchema: AnalyzeMotivationalDriversInputSchema,
    outputSchema: AnalyzeMotivationalDriversOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
