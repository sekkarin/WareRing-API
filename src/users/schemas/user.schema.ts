import * as mongoose from 'mongoose';
import { Dashboard } from 'src/dashboard/interfaces/dashboard.interface';
import { Device } from 'src/device/interface/device.interface';
import { Data } from 'src/webhook/interfaces/data.interface';
import { Widget } from 'src/widget/interface/widget.interface';

const UserSchema = new mongoose.Schema(
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
UserSchema.pre('deleteOne', async function (next) {
  try {
    const userId = this.getQuery()._id;
    const devices = await this.model.db
      .model<Device>('Device')
      .find({ userID: userId });
    // filter id devices
    const devicesId = devices.map((device) => device._id);
    // delete dashboard
    await this.model.db
      .model<Dashboard>('Dashboard')
      .deleteMany({ userID: userId });
    // delete data and widgets
    devicesId.map(async (id) => {
      await this.model.db.model<Widget>('Widget').deleteMany({ deviceId: id });
      await this.model.db.model<Data>('DATA').deleteMany({ deviceId: id });
    });
    // delete device
    await this.model.db.model<Device>('Device').deleteMany({ userID: userId });
    next();
  } catch (error) {
    throw error;
  }
});
export { UserSchema };
