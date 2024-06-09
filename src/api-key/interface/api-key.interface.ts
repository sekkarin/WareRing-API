import { Document } from 'mongoose';

export interface APIKey extends Document {
  key: string;
  description?: string;
  name: string;
  expiresIn?: Date;
  active?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
