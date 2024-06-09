import * as mongoose from 'mongoose';
import { Dashboard } from 'src/dashboard/interfaces/dashboard.interface';
import { Widget } from '../interface/widget.interface';
const { Types } = mongoose;
const WidgetSchema = new mongoose.Schema(
  {
    deviceId: {
      type: Types.ObjectId,
      ref: 'Device',
    },
    label: {
      type: String,
      trim: true,
      required: true,
    },
    type: {
      type: String,
      trim: true,
      required: true,
    },
    configWidget: {
      type: Object,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
WidgetSchema.pre('findOneAndRemove', async function (next) {
  try {
    const _id = this.getQuery()._id;
    const deviceId = this.getQuery().deviceId;

    const dashboard = await this.model.db
      .model<Dashboard>('Dashboard')
      .findOneAndUpdate(
        { 'widgets.widget': _id.toString() },
        {
          $pull: {
            widgets: { widget: _id.toString() },
          },
        },
        {
          new: true,
        },
      );

    if (dashboard) {
      const removeDevice = dashboard.widgets.some((widget) =>
        widget.widget.toString().includes(deviceId.toString()),
      );

      if (!removeDevice) {
        const filteredDevice = dashboard.devices.filter(
          (device) => device.toString() !== deviceId.toString(),
        );

        dashboard.devices = filteredDevice;
        await dashboard.save();
      }
    }

    next();
  } catch (error) {
    console.log('error delete');
    throw error;
  }
});
export { WidgetSchema };
