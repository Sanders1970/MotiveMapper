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
    const handleAuthStateChanged = (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is authenticated, now get their data from Firestore.
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubscribeSnapshot = onSnapshot(userDocRef, 
          (docSnap) => {
            if (docSnap.exists()) {
              // We have the user data from Firestore.
              setUser({
                uid: firebaseUser.uid,
                ...(docSnap.data() as Omit<User, 'uid'>),
              });
            } else {
              // This is an edge case: authenticated user without a Firestore document.
              // This could happen if the initial document write failed. Treat as not fully logged in.
              console.error(`User document not found for UID: ${firebaseUser.uid}. Logging out.`);
              setUser(null);
            }
            // We have a definitive answer (either user data or none), so stop loading.
            setLoading(false);
          }, 
          (error) => {
            // An error occurred fetching the document.
            console.error("Firestore onSnapshot error:", error);
            setUser(null);
            setLoading(false); // Stop loading on error too.
          }
        );
        
        // Return the function to unsubscribe from snapshot listener on cleanup.
        return unsubscribeSnapshot;

      } else {
        // User is not logged in.
        setUser(null);
        setLoading(false);
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, handleAuthStateChanged);

    // Cleanup subscription on component unmount.
    return () => unsubscribeAuth();
  }, []);

  const value = { user, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}