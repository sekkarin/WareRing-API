import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { Device } from 'src/device/interface/device.interface';
import { Data } from './interfaces/data.interface';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { AuthDeviceDto } from './dto/auth-device.dto';
import { AuthzDeviceDto } from './dto/authz-device.dto';

@Injectable()
export class WebhookService {
  constructor(
    @Inject('DEVICE_MODEL')
    private deviceModel: Model<Device>,
    @Inject('DATA_MODEL')
    private dataModel: Model<Data>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  async save(body: any) {
    const { username, topic, qos, event, payload } = body;
    let device: any;
    try {
      if (event !== 'message.publish') {
        throw new BadRequestException('invalid event');
      }
      const deviceCached = await this.cacheManager.get<string>(topic);
      if (deviceCached) {
        device = JSON.parse(deviceCached) as Document;
      } else {
        device = await this.deviceModel.findOne({
          usernameDevice: username,
          qos: qos,
          'topics.0': topic,
        });
        await this.cacheManager.set(topic, JSON.stringify(device), 60000);
      }

      if (!device) {
        throw new NotFoundException('Device not found.');
      }
      if (!device.isSaveData) {
        return {
          message: 'not save date',
        };
      }
      const toObject = JSON.parse(payload.replace(/'/g, '"'));
      // const dataDevice = await this.insertData(device, toObject);
      return { device, toObject };
    } catch (error) {
      throw error;
    }
  }
  async authenticationDevice({ clientId, password, username }: AuthDeviceDto) {
    try {
      const device = await this.deviceModel.findOne({
        usernameDevice: username,
        password_law: password,
      });
      if (!device) {
        throw new NotFoundException(`No device found`);
      }
      const result = await bcrypt.compare(password, device.password_hash);
      if (!result) {
        throw new ForbiddenException('Password mismatch');
      }
      device.clientId = clientId;
      await device.save();
      return {
        result: 'allow',
      };
    } catch (error) {
      throw error;
    }
  }

  async authorizationDevice({
    clientId,
    action,
    username,
    topic,
  }: AuthzDeviceDto) {
    try {
      const device = await this.deviceModel.findOne({
        usernameDevice: username,
        clientId,
        topics: topic,
      });
      if (!device) {
        throw new ForbiddenException();
      }
      if (device.action == 'deny') {
        return {
          result: 'deny',
        };
      }
      return {
        result: 'allow',
      };
    } catch (error) {
      throw error;
    }
  }

  async insertData(device: any, toObject: any) {
    return await this.dataModel.create({
      deviceId: device._id,
      payload: toObject,
    });
  }
}
