import type { Timestamp } from 'firebase/firestore';

export type Role =
  | 'user'
  | 'admin'
  | 'hoofdadmin'
  | 'subsuperadmin'
  | 'superadmin';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: Role;
  createdAt: Timestamp | null;
  lastLogin: Timestamp | null;
  selectedColors?: string[];
  parentId?: string | null;
  parentDisplayName?: string;
}
