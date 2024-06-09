import * as mongoose from 'mongoose';

const ApiKeySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      max: 30,
    },
    description: {
      type: String,
      max: 255,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    expiresIn: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

export { ApiKeySchema };
