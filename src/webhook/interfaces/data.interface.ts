import { Document } from 'mongoose';
export type role = 'user' | 'admin';
export interface Data extends Document {
  deviceId: string;
  payload: Record<string, any>;
  timestamps: Date;
}
