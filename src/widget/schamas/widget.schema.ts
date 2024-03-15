import * as mongoose from 'mongoose';
const { Types } = mongoose;
export const WidgetSchema = new mongoose.Schema(
  {
    deviceId: {
      type: Types.ObjectId,
      ref: 'Device',
    },
    label: {
      type: String,
      trim: true,
      required: true
    },
    type: {
      type: String,
      trim: true,
      required: true
    },
    configWidget:{
      type: Object,
      required: true
    }
   
  },
  {
    timestamps: true,
  },
);
