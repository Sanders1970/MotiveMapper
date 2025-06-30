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
  } catch (error) {
    console.error('Registration error:', error);

    let errorMessage = 'An unexpected error occurred during registration.';
    if (error instanceof Error) {
        errorMessage = error.message;
        if ('code' in error) {
            const firebaseError = error as { code: string; message: string };
            switch (firebaseError.code) {
                case 'auth/email-already-in-use':
                  errorMessage = 'This email address is already registered.';
                  break;
                case 'auth/weak-password':
                  errorMessage = 'Password is too weak. Must be at least 6 characters long.';
                  break;
                case 'auth/invalid-email':
                  errorMessage = 'The provided email address is invalid.';
                  break;
                case 'permission-denied':
                case 'firestore/permission-denied':
                  errorMessage = 'Registration failed: Insufficient permissions to create user profile. Please check your Firestore rules.';
                  break;
                default:
                  errorMessage = `An error occurred: ${firebaseError.code}. Please try again.`;
                  break;
            }
        }
    }
    return { error: errorMessage };
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
    if (
      error.code === 'auth/invalid-credential' ||
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/wrong-password'
    ) {
      return { error: 'Ongeldig emailadres of wachtwoord.' };
    }
    console.error('Login error:', error);
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
    console.error('Password reset error:', error);
    // Also return a generic success message on error to avoid user enumeration.
     return {
      success: `Als er een account bestaat voor ${email}, is er een herstellink verzonden.`,
    };
  }
}
