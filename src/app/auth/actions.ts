'use server';

import { auth } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Registration no longer requires a display name from the user.
// It will be sourced from the invitation.
const registerSchema = z.object({
  email: z.string().email({ message: 'Ongeldig emailadres.' }),
  password: z
    .string()
    .min(6, { message: 'Wachtwoord moet minimaal 6 karakters lang zijn.' }),
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Ongeldig emailadres.' }),
});


export interface AuthState {
  error?: string;
  success?: string;
  user?: {
    uid: string;
    email: string | null;
  };
  displayName?: string;
}

export async function registerAction(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const validatedFields = registerSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    return {
      error:
        fieldErrors.email?.[0] ||
        fieldErrors.password?.[0],
    };
  }

  const { email, password } = validatedFields.data;

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    // Return user info to the client to create the profile.
    return {
        success: 'Account created! Finalizing profile...',
        user: {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
        },
        // DisplayName is no longer relevant here, it will be set from invitation data.
        displayName: '',
    }
    
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      return { error: 'Dit e-mailadres is al in gebruik.' };
    }
    console.error("Register Action Error:", error);
    return { error: 'Registratie mislukt: ' + error.message };
  }
}

export async function forgotPasswordAction(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const validatedFields = forgotPasswordSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    return {
      error: fieldErrors.email?.[0],
    };
  }

  const { email } = validatedFields.data;

  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: `Als er een account bestaat voor ${email}, is er een herstellink verzonden.`,
    };
  } catch (error) {
     return {
      success: `Als er een account bestaat voor ${email}, is er een herstellink verzonden.`,
    };
  }
}
