import type { Timestamp } from 'firebase/firestore';

export type Role = 'user' | 'admin' | 'superadmin';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: Role;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  selectedColors?: string[];
}
