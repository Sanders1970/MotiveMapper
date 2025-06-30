'use client';

import { auth, db } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
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
        // This is a new login or session restoration.
        // Update the lastLogin timestamp. This is robust and fixes data inconsistencies.
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        updateDoc(userDocRef, { lastLogin: serverTimestamp() }).catch(err => {
            console.error("Failed to update lastLogin. This might be expected if the user document doesn't exist yet during registration.", err.code);
        });

        // Base user object is available immediately. This prevents redirect loops.
        setUser({ 
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            role: 'user' // Assume 'user' role until Firestore data loads
        } as User);

        // Now, listen for the full user profile from Firestore.
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            // Firestore doc exists, merge with existing data to get the full profile.
            setUser(prevUser => ({
                ...prevUser!, // We know prevUser is not null here
                ...docSnap.data(),
            }));
          }
          // If doc doesn't exist, we stick with the base user object.
          // The registration process is responsible for creating it.
          setLoading(false);
        }, (error) => {
          console.error("Firestore onSnapshot error:", error);
          // On error, we still have the base user, but stop loading.
          setLoading(false);
        });

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
