'use server';

import { auth, db } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
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
    const user = userCredential.user;

    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: displayName,
      role: 'user',
      parentId: null,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
  } catch (error: any) {
    // The server action was crashing when trying to process the 'error' object.
    // We now return a simple, hardcoded error message to avoid the crash and
    // inform the user that the problem is very likely with Firestore rules.
    return {
        error: 'Registratie mislukt. De gebruikersauthenticatie is gelukt, maar het aanmaken van het gebruikersprofiel in de database is mislukt. Controleer uw Firestore-regels.'
    };
  }

  redirect('/dashboard');
}

export async function loginAction(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const validatedFields = loginSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      error:
        validatedFields.error.flatten().fieldErrors.email?.[0] ||
        validatedFields.error.flatten().fieldErrors.password?.[0],
    };
  }

  const { email, password } = validatedFields.data;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await setDoc(
      doc(db, 'users', user.uid),
      {
        lastLogin: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error: any) {
    // Catch-all for any other login failure, including potential Firestore issues.
    if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        switch (firebaseError.code) {
            case 'auth/invalid-credential':
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                return { error: 'Ongeldig emailadres of wachtwoord.' };
            default:
                 return { error: 'Login mislukt. Dit kan te wijten zijn aan ongeldige inloggegevens of een permissieprobleem met de database.' };
        }
    }
    
    return {
      error: 'Er is een onverwachte fout opgetreden tijdens het inloggen.',
    };
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
    return {
      error: validatedFields.error.flatten().fieldErrors.email?.[0],
    };
  }

  const { email } = validatedFields.data;

  try {
    await sendPasswordResetEmail(auth, email);
    // For security reasons, we don't reveal if an email is registered or not.
    return {
      success: `Als er een account bestaat voor ${email}, is er een herstellink verzonden.`,
    };
  } catch (error: any) {
    // Also return a generic success message on error to avoid user enumeration.
     return {
      success: `Als er een account bestaat voor ${email}, is er een herstellink verzonden.`,
    };
  }
}
