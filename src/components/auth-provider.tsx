'use client';

import { auth, db } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
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

        // Silently update lastLogin on every auth state change.
        // This is a "fire and forget" operation. If it fails (e.g., during
        // registration before the doc exists), it's not critical. It will
        // succeed on all subsequent logins.
        updateDoc(userDocRef, { lastLogin: serverTimestamp() }).catch(() => {
          // Errors are ignored intentionally.
        });

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
                lastLogin: data.lastLogin || null, // Ensure lastLogin is at least null
                parentId: data.parentId || null,
                parentDisplayName: data.parentDisplayName || '',
              });
            } else {
              // This handles the brief moment during registration where the auth
              // user exists but the firestore doc doesn't yet.
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                role: 'user', // Default role
                createdAt: null,
                lastLogin: null, // Default to null
                parentId: null,
              } as User);
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
