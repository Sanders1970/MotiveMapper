'use client';

import { auth, db } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
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
        // User is authenticated, now get their data from Firestore.
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            // We have the user data from Firestore.
            const userData = docSnap.data();
            setUser({
              uid: firebaseUser.uid,
              // Ensure role defaults to 'user' if not present
              role: 'user', 
              ...userData,
            } as User);
          } else {
            // This can happen if the doc creation failed after registration.
            // Treat as not fully logged in.
            setUser(null);
          }
          setLoading(false); // Stop loading ONLY after we have a firestore result
        }, (error) => {
          console.error("Firestore onSnapshot error:", error);
          setUser(null);
          setLoading(false);
        });

        return () => unsubscribeSnapshot(); // Cleanup snapshot listener
      } else {
        // User is not logged in.
        setUser(null);
        setLoading(false);
      }
    });

    // Cleanup auth subscription on component unmount.
    return () => unsubscribe();
  }, []);

  const value = { user, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}