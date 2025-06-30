'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { z } from 'zod';

// Schema for form validation
const inviteSchema = z.object({
  displayName: z.string().min(3, { message: 'Display name must be at least 3 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  role: z.enum(['user', 'admin', 'hoofdadmin', 'subsuperadmin', 'superadmin']),
  parentId: z.string().min(1, { message: 'Inviter ID is missing.' })
});

export interface InviteState {
  error?: string;
  success?: string;
}

// Action to create an invitation
export async function inviteUserAction(prevState: InviteState, formData: FormData): Promise<InviteState> {
  const validatedFields = inviteSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    return {
      error: Object.values(fieldErrors).flat()[0] || 'Invalid data provided.'
    };
  }

  const { email, displayName, role, parentId } = validatedFields.data;

  try {
    // Check if an invitation for this email already exists
    const invitationsRef = collection(db, 'invitations');
    const qInvites = query(invitationsRef, where('email', '==', email));
    const existingInvitation = await getDocs(qInvites);
    if (!existingInvitation.empty) {
      return { error: 'An invitation for this email address already exists.' };
    }

    // Check if a user with this email already exists
    const usersRef = collection(db, 'users');
    const qUsers = query(usersRef, where('email', '==', email));
    const existingUser = await getDocs(qUsers);
    if (!existingUser.empty) {
        return { error: 'A user with this email address already exists.' };
    }

    // Create the invitation document
    await addDoc(invitationsRef, {
      email,
      displayName,
      role,
      parentId,
      createdAt: serverTimestamp(),
    });

    return { success: `Invitation for ${displayName} (${email}) has been created. They can now complete their registration.` };

  } catch (error: any) {
    console.error('Error creating invitation:', error);
    return { error: error.message || 'Failed to create invitation due to an unknown error.' };
  }
}
