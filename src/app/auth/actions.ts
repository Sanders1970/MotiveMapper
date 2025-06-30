'use server';

import { auth, db } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
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
    // TEMPORARILY DISABLED a user profile creation in the database to isolate the server crash.
    // This is a diagnostic step.
    /*
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: userCredential.user.email,
      displayName: displayName,
      role: 'user', 
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
    */
    
  } catch (error: any) {
    return {
        error: 'Registratie mislukt: Kan gebruiker niet aanmaken in Authenticatie.'
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
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    return {
      error:
        fieldErrors.email?.[0] ||
        fieldErrors.password?.[0],
    };
  }

  const { email, password } = validatedFields.data;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    // TEMPORARILY DISABLED lastLogin update to isolate the server crash.
    /*
    await updateDoc(doc(db, 'users', userCredential.user.uid), {
      lastLogin: serverTimestamp(),
    });
    */
  } catch (error: any) {
    return { error: 'Login mislukt. Controleer uw e-mailadres en wachtwoord.' };
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
  } catch (error: any) {
     return {
      success: `Als er een account bestaat voor ${email}, is er een herstellink verzonden.`,
    };
  }
}
