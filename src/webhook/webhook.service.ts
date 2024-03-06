import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { Device } from 'src/device/interface/device.interface';
import { Data } from './interfaces/data.interface';

@Injectable()
export class WebhookService {
  constructor(
    @Inject('DEVICE_MODEL')
    private deviceModel: Model<Device>,
    @Inject('DATA_MODEL')
    private dataModel: Model<Data>,
  ) {}
  async save(body: any) {
    const { username, topic, qos, flags, event, payload } = body;
    try {
      if (event !== 'message.publish') {
        throw new BadRequestException('invalid event');
      }
      const device = await this.deviceModel.findOne({
        usernameDevice: username,
        qos: qos,
        retain: flags?.retain,
        'topics.0': topic,
      });
      if (!device) {
        throw new NotFoundException('Device not found.');
      }
      if (!device.isSaveData) {
        return {
          message: 'not save date',
        };
      }
      const toObject = JSON.parse(payload.replace(/'/g, '"'));
      const dataDevice = await this.dataModel.create({
        deviceId: device.id,
        payload: toObject,
      });

      return dataDevice;
    } catch (error) {
      throw error;
    }
  }
}
