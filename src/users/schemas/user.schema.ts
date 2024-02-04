import * as mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    roles: [
      {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
      },
    ],
    isActive: {
      type: Boolean,
      default: false,
    },
    profileUrl: String,
    tokenEMQX: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    verifired: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);
