import * as mongoose from 'mongoose';
const { Types } = mongoose;

export const dashboardSchema = new mongoose.Schema(
  {
    userID: {
      type: Types.ObjectId,
      ref: 'User',
    },
    nameDashboard: { type: String, required: true, trim: true, max: 50 },
    description: { type: String, required: true, trim: true, max: 255 },
    devices: [{ type: Types.ObjectId, ref: 'Device' }],
    widgets: [{ type: Types.ObjectId, ref: 'Widget' }],
  },
  {
    timestamps: true,
  },
);
