import { Document } from 'mongoose';
export type role = 'user' | 'admin';
export interface User extends Document {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  roles: role[];
  profileUrl: string;
  tokenEMQX: string;
  isActive: boolean;
  verifired: boolean;
  refreshToken: string;
  createdAt: string;
}
