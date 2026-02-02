export type UserRole = 'admin' | 'caregiver' | 'user';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email: string;
  status: 'active' | 'inactive';
  lastLogin?: Date;
}
