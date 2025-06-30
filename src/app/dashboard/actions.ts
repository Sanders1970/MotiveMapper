'use server';

import { analyzeMotivationalDrivers } from '@/ai/flows/analyze-motivational-drivers';
import { z } from 'zod';

const formSchema = z.object({
  text: z.string().min(20, { message: 'Please enter at least 20 characters for a meaningful analysis.' }),
});

export interface ActionState {
  motivations?: string[];
  summary?: string;
  error?: string;
  input?: string;
}

export async function scanTextAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const text = formData.get('text') as string;
  const validatedFields = formSchema.safeParse({ text });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.text?.[0],
      input: text,
    };
  }

  try {
    const result = await analyzeMotivationalDrivers({ text: validatedFields.data.text });
    if (result) {
      return {
        motivations: result.motivations,
        summary: result.summary,
        input: validatedFields.data.text
      };
    }
    return { error: 'Analysis failed to return a result.', input: validatedFields.data.text };
  } catch (error) {
    console.error(error);
    return { error: 'An unexpected error occurred during analysis.', input: validatedFields.data.text };
  }
}
