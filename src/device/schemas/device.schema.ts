import * as mongoose from 'mongoose';

export const DeviceSchema = new mongoose.Schema(
  {
    userID: {
      type: String,
    },
    nameDevice: {
      type: String,
    },
    usernameDevice: {
      type: String,
    },
    password_hash: {
      type: String,
    },
    description: {
      type: String,
    },
    permission: {
      type: String,
    },
    subscribe: {
      type: [String],
    },
    publish: [String],
    action: {
      type: String,
    },
    qos: [String],
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
