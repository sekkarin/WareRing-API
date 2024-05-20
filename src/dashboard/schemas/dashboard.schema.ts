import * as mongoose from 'mongoose';
const { Types } = mongoose;
export enum Columns {
  Column1 = 'column-1',
  Column2 = 'column-2',
  Column3 = 'column-3',
}

export const dashboardSchema = new mongoose.Schema(
  {
    userID: {
      type: Types.ObjectId,
      ref: 'User',
    },
    nameDashboard: { type: String, required: true, trim: true, max: 50 },
    description: { type: String, required: true, trim: true, max: 255 },
    devices: [{ type: Types.ObjectId, ref: 'Device' }],
    widgets: [
      {
        widget: { type: Types.ObjectId, ref: 'Widget' },
        column: { type: String, required: true, enum: [Columns] },
      },
    ],
  },
  {
    timestamps: true,
  },
);
