import * as mongoose from 'mongoose';
const { Types } = mongoose;
export const DataSchema = new mongoose.Schema({
  deviceId: {
    type: Types.ObjectId,
    ref: 'Device',
  },
  payload: {
    type: Object,
  },
  timestamps: {
    type: Date,
    default: new Date(),
  },
});
