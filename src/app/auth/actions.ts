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
    console.error('Registration error:', error);

    let errorMessage =
      'Er is een onverwachte fout opgetreden bij de registratie.';
    if (error.code) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Dit emailadres is al geregistreerd.';
          break;
        case 'auth/weak-password':
          errorMessage =
            'Wachtwoord is te zwak. Gebruik minimaal 6 karakters.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Het opgegeven emailadres is ongeldig.';
          break;
        case 'permission-denied':
        case 'firestore/permission-denied':
          errorMessage =
            'Registratie mislukt: onvoldoende rechten om gebruikersprofiel aan te maken. Controleer je Firestore-regels.';
          break;
        default:
          errorMessage = `Fout: ${error.code}. Probeer het opnieuw of controleer de Firebase-configuratie.`;
          break;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return { error: errorMessage };
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
    console.error('Login error:', error);
    return {
      error: 'Er is een onverwachte fout opgetreden tijdens het inloggen.',
    };
  }

  redirect('/dashboard');
}
