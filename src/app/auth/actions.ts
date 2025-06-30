'use server';

import { auth, db } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
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

export interface AuthState {
  error?: string;
}

function checkFirebaseConfig() {
  if (
    !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    !process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ) {
    return 'Firebase-configuratie ontbreekt. Vul de credentials in het .env-bestand in.';
  }
  return null;
}

export async function registerAction(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const configError = checkFirebaseConfig();
  if (configError) {
    return { error: configError };
  }

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
    if (error.code === 'auth/email-already-in-use') {
      return { error: 'Dit emailadres is al geregistreerd.' };
    }
    if (error.code === 'auth/weak-password') {
      return { error: 'Wachtwoord is te zwak. Gebruik minimaal 6 karakters.' };
    }
    if (error.code === 'auth/invalid-email') {
      return { error: 'Het opgegeven emailadres is ongeldig.' };
    }
    if (error.code === 'permission-denied') {
      return {
        error:
          'Registratie mislukt: onvoldoende rechten om gebruikersprofiel aan te maken. Controleer je Firestore-regels.',
      };
    }
    const errorMessage = error.message ? `: ${error.message}` : '.';
    return { error: `Er is een onverwachte fout opgetreden bij de registratie${errorMessage}` };
  }

  redirect('/dashboard');
}

export async function loginAction(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const configError = checkFirebaseConfig();
  if (configError) {
    return { error: configError };
  }
  
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
    const errorMessage = error.message ? `: ${error.message}` : '.';
    return { error: `Er is een onverwachte fout opgetreden tijdens het inloggen${errorMessage}` };
  }

  redirect('/dashboard');
}
