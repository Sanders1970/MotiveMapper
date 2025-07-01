import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// This configuration object reads values from environment variables.
// In the live App Hosting environment, these variables are populated from
// the secrets you create in Google Cloud Secret Manager, as defined in apphosting.yaml.
// If any of these are missing or inaccessible, Firebase initialization will fail.
export const firebaseConfig = {
  // Populated by the 'NEXT_PUBLIC_FIREBASE_API_KEY' secret
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // Populated by the 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN' secret
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  // Populated by the built-in ${FIREBASE_PROJECT_ID} variable in apphosting.yaml
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // Populated by the 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET' secret
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  // Populated by the 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID' secret
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  // Populated by the 'NEXT_PUBLIC_FIREBASE_APP_ID' secret
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// This check provides a clear error if the API key is missing.
// The error you are seeing originates here, because `apiKey` is undefined on the server.
if (!firebaseConfig.apiKey) {
  throw new Error(
    'CRITICAL: Firebase API Key is not defined. This is a configuration issue. Please double-check your secrets in Google Cloud Secret Manager. Ensure they are correctly named and that the App Hosting service account has the "Secret Manager Secret Accessor" role for each secret.'
  );
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };