
'use server';

import { auth } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const registerSchema = z.object({
  displayName: z
    .string()
    .min(3, { message: 'Weergavenaam moet minimaal 3 karakters lang zijn.' }),
  email: z.string().email({ message: 'Ongeldig emailadres.' }),
  password: z
    .string()
    .min(6, { message: 'Wachtwoord moet minimaal 6 karakters lang zijn.' }),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, { message: 'Wachtwoord is verplicht.' }),
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
        fieldErrors.displayName?.[0] ||
        fieldErrors.email?.[0] ||
        fieldErrors.password?.[0],
    };
  }

  const { email, password, displayName } = validatedFields.data;

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    // Return user info to the client to create the profile.
    // This avoids server-side auth context issues with the Firebase client SDK.
    return {
        success: 'Account created! Finalizing profile...',
        user: {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
        },
        displayName: displayName,
    }
    
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      return { error: 'Dit e-mailadres is al in gebruik.' };
    }
    return { error: error.message || 'Registratie mislukt: er is een onbekende fout opgetreden.' };
  }
}

export async function loginAction(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const validatedFields = loginSchema.safeParse(
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
    // We remove the updateDoc for lastLogin to avoid server-side auth issues.
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
  } catch (error: any) {
     if (error.code === 'auth/invalid-credential') {
        return { error: 'Ongeldige inloggegevens. Controleer uw e-mailadres en wachtwoord.' };
     }
     return { error: error.message || 'Inloggen mislukt: er is een onbekende fout opgetreden.' };
  }

  redirect('/dashboard');
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
