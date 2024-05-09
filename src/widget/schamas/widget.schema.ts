import * as mongoose from 'mongoose';
import { Dashboard } from 'src/dashboard/interfaces/dashboard.interface';
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
WidgetSchema.pre('deleteOne', async function (next) {
  try {
    const widgetId = this.getQuery()._id;
    await this.model.db.model<Dashboard>('Dashboard').updateMany(
      { 'dashboardInfo.widgets': widgetId },
      {
        $pull: {
          'dashboardInfo.$.widgets': widgetId,
        },
      },
      {
        new: true,
      },
    );

    await this.model.db
      .model<Dashboard>('Dashboard')
      .updateMany(
        {},
        { $pull: { dashboardInfo: { widgets: { $size: 0 } } } },
        { new: true },
      );

    next();
  } catch (error) {
    throw error;
  }
});
export { WidgetSchema };
