import { Document, Types } from 'mongoose';
import { Widget } from 'src/widget/interface/widget.interface';
import { Columns } from '../schemas/dashboard.schema';

// interface
export interface Dashboard extends Document {
  userID: string;
  devices: (Types.ObjectId | string)[];
  widgets: { widget: Widget; column: Columns }[];
  description: string;
  nameDashboard: string;
  createdAt: Date;
  updatedAt: Date;
}
