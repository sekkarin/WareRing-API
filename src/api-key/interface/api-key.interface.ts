import { Document } from 'mongoose';

export interface APIKey extends Document {
  key: string;
  description: string;
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
