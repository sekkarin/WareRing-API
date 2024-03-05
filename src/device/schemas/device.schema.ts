import * as mongoose from 'mongoose';
const { Types } = mongoose;
export const DeviceSchema = new mongoose.Schema(
  {
    userID: {
      type: Types.ObjectId,
      ref: 'User',
    },
    nameDevice: {
      type: String,
      required: true,
      min: 1,
      max:25,
      trim: true,
    },
    usernameDevice: {
      type: String,
      unique: true,
      required: true,
      min: 1,
      max:25,
      trim: true,
    },
    password_hash: {
      type: String,
      required: true,
      trim: true,
    },
    password_law: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      min: 1,
      max:255,
      trim: true,
    },
    permission: {
      type: String,
      enum: ['deny', 'allow'],
      default: 'allow',
    },
    // FIXME: change topic to sub document
    topics: {
      type: [String],
    },
    action: {
      type: String,
      enum: ['publish', 'subscribe', 'all'],
      default: 'all',
    },
    qos: {
      type: Number,
      enum: [0, 1, 2],
      default: 0,
    },
    retain: {
      type: Boolean,
      default: false,
    },
    isSaveData: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);
