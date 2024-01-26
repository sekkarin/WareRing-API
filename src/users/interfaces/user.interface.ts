import { Document } from 'mongoose';

export interface User extends Document {
  email: string;
  password: string;
  fname: string;
  lname: string;
  role: {
    User: string;
    Admin: string;
  };
  username: string;
  phone: string;
  nameTitle: string;
  refreshToken?: string;
  isAlive: boolean;
  profileUrl: string;
  createdAt: Date;
  updatedAt: Date;
}
