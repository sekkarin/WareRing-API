import * as mongoose from 'mongoose';
import { Dashboard } from 'src/dashboard/interfaces/dashboard.interface';
import { Widget } from 'src/widget/interface/widget.interface';

const { Types } = mongoose;
const DeviceSchema = new mongoose.Schema(
  {
    userID: {
      type: Types.ObjectId,
      ref: 'User',
    },
    nameDevice: {
      type: String,
      required: true,
      min: 1,
      max: 25,
      trim: true,
    },
    usernameDevice: {
      type: String,
      unique: true,
      required: true,
      min: 1,
      max: 25,
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
    // FIXME: allow description empty string
    description: {
      type: String,
      min: 1,
      max: 255,
      trim: true,
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
DeviceSchema.pre('findOneAndDelete', async function (next) {
  try {
    const deviceId = this.getQuery()._id;
    const widgets = await this.model.db
      .model<Widget>('Widget')
      .find({ deviceId: deviceId });

    await this.model.db.model<Dashboard>('Dashboard').updateMany(
      { devices: deviceId },
      {
        $pull: {
          widgets: {
            widget: { $in: widgets.map((widget) => widget._id.toString()) },
          },
          devices: deviceId,
        },
      },
      { new: true },
    );
    await this.model.db
      .model<Widget>('Widget')
      .deleteMany({ deviceId: deviceId });
    next();
  } catch (error) {
    throw error;
  }
});
export { DeviceSchema };
