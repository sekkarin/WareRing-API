import { Document, Types } from 'mongoose';
interface Widget {
  _id: Types.ObjectId;
}

interface Device {
  _id: Types.ObjectId;
}

interface DashboardInfo {
  device: Types.ObjectId | Device |string;
  widgets: (Types.ObjectId | Widget | string)[];
}
export interface Dashboard extends Document {
  userID: string;
  dashboardInfo: DashboardInfo[];
  description: string;
  nameDashboard: string;
  createdAt: Date;
  updatedAt: Date;
}
