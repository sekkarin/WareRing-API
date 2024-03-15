import { Document } from 'mongoose';

export interface Widget extends Document {
  _id:string;
  deviceId: string;
  label: string;
  type: string;
  configWidget: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  
}