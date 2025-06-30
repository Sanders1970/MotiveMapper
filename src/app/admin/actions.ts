'use server';

import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';

export async function getUsers(): Promise<User[]> {
  try {
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    const userList = userSnapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    })) as User[];
    return userList;
  } catch (error) {
    console.error('Error fetching users: ', error);
    return [];
  }
}

export async function getUser(uid: string): Promise<User | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    return { uid: userSnap.id, ...userSnap.data() } as User;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function updateUserRole(
  uid: string,
  role: 'user' | 'admin' | 'superadmin'
) {
  // In a real app, you MUST verify that the currently authenticated user
  // making this request is a 'superadmin'. This requires passing an ID token
  // and verifying it on the server with Firebase Admin SDK.
  // For this prototype, we'll proceed without that server-side check.
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { role: role });
    return { success: true };
  } catch (error) {
    console.error('Error updating role:', error);
    return { success: false, error: 'Failed to update role.' };
  }
}
