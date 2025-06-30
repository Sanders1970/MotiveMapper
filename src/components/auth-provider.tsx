'use client';

import { auth, db } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  onSnapshot,
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);

        const unsubscribeSnapshot = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              // Construct a complete, safe user object.
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName:
                  data.displayName || firebaseUser.displayName || 'User',
                role: data.role || 'user',
                createdAt: data.createdAt || null,
                lastLogin: data.lastLogin || null,
                parentId: data.parentId || null,
                parentDisplayName: data.parentDisplayName || '',
              });
            } else {
              // This can happen during registration before the Firestore doc is created.
              // It's also a fallback if a user exists in Auth but not Firestore.
              // For a normal login, we assume the doc must exist.
              // Setting user to null will trigger a redirect to login, which is safer
              // than having a partially-hydrated user object.
              setUser(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error('Firestore onSnapshot error:', error);
            setUser(null); // On error, log out the user to be safe.
            setLoading(false);
          }
        );

        return () => unsubscribeSnapshot();
      } else {
        // User is not logged in.
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = { user, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
