import { Document } from 'mongoose';
export type role = 'user' | 'admin';
export interface User extends Document {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly username: string;
  readonly password: string;
  readonly roles: role[];
  readonly profileUrl: string;
  readonly tokenEMQX: string;
  readonly isActive: boolean;
  readonly verifired : boolean
  refreshToken: string;
  createdAt: string;
}
