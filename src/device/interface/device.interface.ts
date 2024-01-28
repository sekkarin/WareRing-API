import { Document } from 'mongoose';

export interface Device extends Document {
  userID: string;
  nameDevice: string;
  usernameDevice: string;
  password_hash: string;
  description: string;
  permission: string;
  subscribe: string[];
  publish: string[];
  action: string;
  qos: string[];
  retain: boolean;
  isSaveData: boolean;
  createdAt: Date;
  updatedAt: Date;
}
