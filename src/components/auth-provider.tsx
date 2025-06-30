'use client';

import { auth, db } from '@/lib/firebase';
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
  console.log(`[AuthProvider] Stap 2: Firestore document opvragen voor UID: ${firebaseUser.uid}`);
  const docSnap = await getDoc(userDocRef);

  if (docSnap.exists()) {
    console.log('[AuthProvider] Stap 3: Document gevonden in Firestore.');
    const data = docSnap.data();

    // Update last login timestamp
    try {
        await updateDoc(userDocRef, { lastLogin: serverTimestamp() });
        console.log('[AuthProvider] Stap 4: "lastLogin" tijdstip bijgewerkt.');
    } catch (error) {
        console.error('[AuthProvider] Fout bij bijwerken lastLogin:', error);
        // Continue even if this fails
    }


    const userProfile: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: data.displayName || 'Gebruiker',
      role: data.role || 'user',
      createdAt: data.createdAt || null,
      lastLogin: data.lastLogin || null, // This will be slightly old, but fine
      parentId: data.parentId || null,
    };
    console.log('[AuthProvider] Stap 5: Gebruikersprofiel succesvol samengesteld:', userProfile);
    return userProfile;
  } else {
    console.error(`[AuthProvider] FOUT: Geen document gevonden in Firestore voor UID: ${firebaseUser.uid}. Inloggen mislukt.`);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('[AuthProvider] Stap 1: Gebruiker is ingelogd bij Firebase Authentication. UID:', firebaseUser.uid);
        try {
          const userProfile = await getUserProfile(firebaseUser);
          setUser(userProfile);
        } catch (error) {
          console.error('[AuthProvider] Kritieke fout bij ophalen profiel:', error);
          setUser(null);
        }
      } else {
        console.log('[AuthProvider] Gebruiker is uitgelogd of niet gevonden.');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
