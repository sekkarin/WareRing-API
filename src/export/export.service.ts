import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { Model } from 'mongoose';

import { Device } from 'src/device/interface/device.interface';
import { Data } from 'src/webhook/interfaces/data.interface';

@Injectable()
export class ExportService {
  constructor(
    @Inject('DEVICE_MODEL')
    private deviceModel: Model<Device>,
    @Inject('DATA_MODEL')
    private dataModel: Model<Data>,
  ) {}
  async exportData(deviceId: string, userID: string) {
    try {
      const deviceExit = await this.deviceModel.findOne({
        _id: deviceId,
        userID,
      });
      if (!deviceExit) {
        throw new NotFoundException('Device not found');
      }
      const data = await this.dataModel.find({ deviceId: deviceExit.id });
      return data.map((data) => {
        return {
          id: data.id,
          deviceId: data.deviceId,
          ...data.payload,
          timestamps: data.timestamps,
        };
      });
    } catch (error) {
      throw error;
    }
  }
}
