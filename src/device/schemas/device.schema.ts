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
    },
    usernameDevice: {
      type: String,
      unique: true,
      required: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    permission: {
      type: String,
      enum: ['deny', 'allow'],
      default: 'allow',
    },
    topics: {
      type: [String],
    },
    action: {
      type: String,
      enum: ['publish', 'subscribe', 'all'],
      default: 'publish',
    },
    qos: {
      type: Number,
      enum: [0, 1, 2],
      default:0
    },
    retain: {
      type: Boolean,
      default: false,
    },
    isSaveData: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);
