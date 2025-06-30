'use client';

import { auth, db, firebaseConfig } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { createContext, useEffect, useState } from 'react';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

async function getUserProfile(firebaseUser: FirebaseUser): Promise<User | null> {
  const userDocRef = doc(db, 'users', firebaseUser.uid);
  
  try {
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      try {
        await updateDoc(userDocRef, { lastLogin: serverTimestamp() });
      } catch (updateError: any) {
         console.warn('[AuthProvider] Warning: Failed to update lastLogin timestamp.', updateError.message);
      }

      const userProfile: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: data.displayName || 'User',
        role: data.role || 'user',
        createdAt: data.createdAt || null,
        lastLogin: data.lastLogin || null,
        parentId: data.parentId || null,
      };
      return userProfile;

    } else {
      console.error(`[AuthProvider] ERROR: No document found in Firestore for UID: ${firebaseUser.uid}. The user exists in Authentication but has no database profile.`);
      return null;
    }
  } catch (error: any) {
    if (error.code === 'unavailable' || (error.message && error.message.includes('offline'))) {
       console.error(`[AuthProvider] CRITICAL ERROR: Could not connect to Firestore. The client is "offline". 
       This likely means the "Cloud Firestore API" is not enabled for project '${firebaseConfig.projectId}', the service account for App Hosting is missing the 'Cloud Datastore User' IAM role, or a billing account is not linked to the project.
       `, error);
    } else {
      console.error('[AuthProvider] Critical error fetching profile:', error);
    }
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const userProfile = await getUserProfile(firebaseUser);
        setUser(userProfile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const value = { user, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
