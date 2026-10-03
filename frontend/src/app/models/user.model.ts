export type UserRole = 'Admin' | 'Manager' | 'Engineer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}
