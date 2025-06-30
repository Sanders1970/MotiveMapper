'use server';

import { db } from '@/lib/firebase';
import type { Role, User } from '@/lib/types';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

async function getAllSubordinates(userId: string): Promise<User[]> {
  const usersCollection = collection(db, 'users');
  const q = query(usersCollection, where('parentId', '==', userId));
  const querySnapshot = await getDocs(q);

  let users: User[] = querySnapshot.docs.map(
    (doc) => ({ uid: doc.id, ...doc.data() } as User)
  );

  for (const user of users) {
    if (['admin', 'hoofdadmin', 'subsuperadmin'].includes(user.role)) {
      const subordinates = await getAllSubordinates(user.uid);
      users = users.concat(subordinates);
    }
  }

  return users;
}

export async function getUsers(currentUser: User): Promise<User[]> {
  try {
    const usersCollection = collection(db, 'users');

    switch (currentUser.role) {
      case 'superadmin': {
        const allUsersSnapshot = await getDocs(usersCollection);
        return allUsersSnapshot.docs.map(
          (doc) => ({ uid: doc.id, ...doc.data() } as User)
        );
      }
      case 'subsuperadmin':
      case 'hoofdadmin':
      case 'admin': {
        return await getAllSubordinates(currentUser.uid);
      }
      default:
        return [];
    }
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

export async function updateUserRole(uid: string, role: Role) {
  // In a real app, you MUST verify that the currently authenticated user
  // making this request is a 'superadmin' and has rights over the user.
  // This requires passing an ID token and verifying it on the server
  // with Firebase Admin SDK. For this prototype, we'll proceed with
  // the client-side UI check which restricts this action.
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { role: role });
    return { success: true };
  } catch (error) {
    console.error('Error updating role:', error);
    return { success: false, error: 'Failed to update role.' };
  }
}
