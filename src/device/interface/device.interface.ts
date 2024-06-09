import { Document } from 'mongoose';

export interface Device extends Document {
  userID: string;
  nameDevice: string;
  usernameDevice: string;
  password_hash: string;
  password_law: string;
  description: string;
  permission: string;
  topics: string[];
  action: string;
  clientId?: string;
  qos: number;
  retain: boolean;
  isSaveData: boolean;
  createdAt: Date;
  updatedAt: Date;
}
