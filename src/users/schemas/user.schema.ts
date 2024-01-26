import * as mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema(
  {
    email: String,
    password: String,
    fname: String,
    lname: String,
    phone: String,
    role: {
      User: {
        default: 'USER',
        type: String,
      },
      Admin: String,
    },
    username: {
      type: String,
      unique: true,
    },
    nameTitle: {
      type: String,
    },
    refreshToken: String,
    isAlive: {
      type: Boolean,
      default: false,
    },
    profileUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);
