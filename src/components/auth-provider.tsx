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
  
  try {
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      console.log('[AuthProvider] Stap 3: Document gevonden in Firestore.');
      const data = docSnap.data();
      
      // Update last login timestamp in the background
      try {
        await updateDoc(userDocRef, { lastLogin: serverTimestamp() });
        console.log('[AuthProvider] Stap 3.5: "lastLogin" tijdstip succesvol bijgewerkt.');
      } catch (updateError: any) {
         console.warn('[AuthProvider] Waarschuwing: "lastLogin" tijdstip kon niet worden bijgewerkt.', updateError.message);
      }

      const userProfile: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: data.displayName || 'Gebruiker',
        role: data.role || 'user',
        createdAt: data.createdAt || null,
        lastLogin: data.lastLogin || null,
        parentId: data.parentId || null,
      };
      console.log('[AuthProvider] Stap 4: Gebruikersprofiel succesvol samengesteld:', userProfile);
      return userProfile;

    } else {
      console.error(`[AuthProvider] FOUT: Geen document gevonden in Firestore voor UID: ${firebaseUser.uid}. De gebruiker bestaat in Authentication, maar heeft geen profiel in de database.`);
      return null;
    }
  } catch (error: any) {
    if (error.code === 'unavailable' || (error.message && error.message.includes('offline'))) {
       console.error('[AuthProvider] KRITIEKE FOUT: Kan geen verbinding maken met Firestore. De client is "offline". Mogelijke oorzaken: (1) Firestore Database is niet aangemaakt/actief. (2) Security Rules blokkeren toegang. (3) Firebase configuratie is incorrect.', error);
    } else {
      console.error('[AuthProvider] Kritieke fout bij ophalen profiel:', error);
    }
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthProvider] Initialisatie: Auth state listener wordt nu ingesteld.');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        console.log('[AuthProvider] Stap 1: Gebruiker is ingelogd bij Firebase Authentication. UID:', firebaseUser.uid);
        const userProfile = await getUserProfile(firebaseUser);
        setUser(userProfile);
        console.log('[AuthProvider] Stap 5: Gebruikersstatus is bijgewerkt in de app.');
      } else {
        console.log('[AuthProvider] Gebruiker is uitgelogd of niet gevonden.');
        setUser(null);
      }
      setLoading(false);
      console.log('[AuthProvider] Klaar: Laden is voltooid.');
    });

    return () => {
      console.log('[AuthProvider] Listener wordt opgeruimd.');
      unsubscribe();
    };
  }, []);

  const value = { user, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
