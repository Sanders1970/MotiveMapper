
'use server';

import { auth, db } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
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
    
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: userCredential.user.email,
      displayName: displayName,
      role: 'user', 
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      parentId: null,
    });
    
  } catch (error) {
    // This is a failsafe. If we land here, it means the Firestore rules are incorrect or database is not available.
    // We return a generic but stable error message to prevent the server from crashing.
    return {
        error: 'Registratie mislukt. Controleer of de Firestore database en regels correct zijn ingesteld.'
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
    await updateDoc(doc(db, 'users', userCredential.user.uid), {
      lastLogin: serverTimestamp(),
    });
  } catch (error) {
     // Return a generic but stable error message to prevent server crash.
     return { error: 'Inloggen mislukt. Controleer uw e-mailadres en wachtwoord.' };
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
     // Also return a generic success message on error to avoid user enumeration.
     // This prevents disclosing whether a user is registered or not.
     return {
      success: `Als er een account bestaat voor ${email}, is er een herstellink verzonden.`,
    };
  }
}
