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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in. Immediately set a basic user object to prevent redirect loops.
        // The role and other details will be filled in by the Firestore snapshot listener.
        if (!user) { // Set initial user state only if not already set by snapshot
           setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            role: 'user', // Default role, will be updated by Firestore
            createdAt: null,
            lastLogin: null,
          });
        }
        
        // Listen for real-time updates to the user document in Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            // User document exists, update the user state with full data
            const userData = docSnap.data() as Omit<User, 'uid'>;
            setUser({
              uid: firebaseUser.uid,
              ...userData,
            });
          } else {
             // This case might happen if the Firestore document creation is delayed or failed.
            console.warn(`User document for UID ${firebaseUser.uid} not found in Firestore.`);
          }
          setLoading(false);
        }, (error) => {
            console.error("Error fetching user document:", error);
            setLoading(false); // Stop loading even if there's an error
        });

        return () => unsubSnapshot(); // Cleanup the snapshot listener
      } else {
        // User is signed out
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe(); // Cleanup the auth state listener
  }, []);

  const value = { user, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
