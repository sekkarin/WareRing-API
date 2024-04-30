import { Document } from 'mongoose';
export interface Dashboard extends Document {
  userID: string;
  widgets: string[];
  description: string;
  nameDashboard: string;
  createdAt: Date;
  updatedAt: Date;
}
