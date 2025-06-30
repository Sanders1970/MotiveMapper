import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// NOTE: Hardcoding credentials for debugging purposes.
// This should be reverted to use environment variables from .env once the issue is resolved.
const firebaseConfig = {
  apiKey: "AIzaSyCtG-AumcNe85tonRRG4bhUXQiPEi1h2H4",
  authDomain: "motivemapper.firebaseapp.com",
  projectId: "motivemapper",
  storageBucket: "motivemapper.firebasestorage.app",
  messagingSenderId: "82217045381",
  appId: "1:82217045381:web:b69aebc8534916f03c08ec"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
