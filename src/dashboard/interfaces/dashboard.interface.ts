import { Document, Types } from 'mongoose';
import { Widget } from 'src/widget/interface/widget.interface';

export interface Dashboard extends Document {
  userID: string;
  devices: (Types.ObjectId | string)[];
  widgets: (Types.ObjectId | string|Widget)[];
  description: string;
  nameDashboard: string;
  createdAt: Date;
  updatedAt: Date;
}
