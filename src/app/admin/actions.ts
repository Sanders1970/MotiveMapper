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

  const directChildren: User[] = querySnapshot.docs.map(
    (doc) => ({ uid: doc.id, ...doc.data() } as User)
  );

  let allDescendants: User[] = [...directChildren];

  for (const child of directChildren) {
    if (['admin', 'hoofdadmin', 'subsuperadmin'].includes(child.role)) {
      const subordinates = await getAllSubordinates(child.uid);
      allDescendants = allDescendants.concat(subordinates);
    }
  }

  return allDescendants;
}


export async function getUsers(currentUser: User): Promise<User[]> {
  try {
    const usersCollection = collection(db, 'users');
    let users: User[] = [];

    switch (currentUser.role) {
      case 'superadmin': {
        const allUsersSnapshot = await getDocs(usersCollection);
        users = allUsersSnapshot.docs.map(
          (doc) => ({ uid: doc.id, ...doc.data() } as User)
        );
        break;
      }
      case 'subsuperadmin':
      case 'hoofdadmin':
      case 'admin': {
        users = await getAllSubordinates(currentUser.uid);
        break;
      }
      default:
        return [];
    }
    
    // Create a map of all users for efficient parent name lookup
    const allUsersSnapshot = await getDocs(collection(db, 'users'));
    const userMap = new Map<string, string>();
    allUsersSnapshot.forEach(doc => {
        if (doc.data().displayName) {
          userMap.set(doc.id, doc.data().displayName);
        }
    });

    // Augment users with their parent's display name
    return users.map(user => ({
        ...user,
        parentDisplayName: user.parentId ? userMap.get(user.parentId) || 'Unknown' : 'None'
    }));

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

    const user = { uid: userSnap.id, ...userSnap.data() } as User;

    if (user.parentId) {
      const parentSnap = await getDoc(doc(db, 'users', user.parentId));
      if (parentSnap.exists() && parentSnap.data().displayName) {
        user.parentDisplayName = parentSnap.data().displayName;
      } else {
        user.parentDisplayName = 'Unknown';
      }
    } else {
      user.parentDisplayName = 'None';
    }

    return user;
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
