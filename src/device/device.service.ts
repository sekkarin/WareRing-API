// TODO: add clientID
import {
  ConflictException,
  Inject,
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Model } from 'mongoose';
import { Device } from './interface/device.interface';
import * as bcrypt from 'bcrypt';
import { DeviceResponseDto } from './dto/response-device.dto';
import { Permission } from './types/permission.type';

@Injectable()
export class DeviceService {
  constructor(
    @Inject('DEVICE_MODEL')
    private deviceModel: Model<Device>,
  ) {}

  async create(
    createDeviceDto: CreateDeviceDto,
    userID: string,
  ): Promise<DeviceResponseDto> {
    const findDeviceDuplicates = await this.deviceModel.findOne({
      usernameDevice: createDeviceDto.usernameDevice,
    });

    if (findDeviceDuplicates) {
      throw new BadRequestException(
        'Device with this usernameDevice already exists',
      );
    }
    const password_hash = await bcrypt.hash(createDeviceDto.password, 10);
    const device = new this.deviceModel({
      password_hash,
      userID,
      ...createDeviceDto,
    });
    await device.save();
    return this.mapToDeviceResponseDto(device);
  }

  private mapToDeviceResponseDto(device: Device): DeviceResponseDto {
    return {
      id: device.id,
      userID: device.userID,
      nameDevice: device.nameDevice,
      usernameDevice: device.usernameDevice,
      description: device.description,
      permission: device.permission,
      topics: device.topics,
      action: device.action,
      qos: device.qos,
      retain: device.retain,
      isSaveData: device.isSaveData,
      createdAt: device.createdAt,
    };
  }

  async findAll(
    page = 1,
    perPage = 10,
    userID: string,
  ): Promise<DeviceResponseDto[]> {
    try {
      const totalItems = await this.deviceModel.countDocuments();
      const totalPages = Math.ceil(totalItems / perPage);
      if (page > totalPages) {
        return [];
      }
      const devices = await this.deviceModel
        .find({ userID })
        .skip((page - 1) * perPage)
        .limit(perPage);

      const devicesResponse = devices.map((device) =>
        this.mapToDeviceResponseDto(device),
      );

      return devicesResponse;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async findOne(id: string, userID: string): Promise<DeviceResponseDto> {
    try {
      const device = await this.deviceModel.findOne({ _id: id, userID });
      if (!device) {
        throw new NotFoundException('Device not found');
      }
      return this.mapToDeviceResponseDto(device);
    } catch (error) {
      throw error;
    }
  }

  async update(
    id: string,
    userID: string,
    updateDeviceDto: UpdateDeviceDto,
  ): Promise<DeviceResponseDto> {
    try {
      const usernameDeviceDuplicate = await this.deviceModel.findOne({
        usernameDevice: updateDeviceDto.usernameDevice,
        userID,
      });
      if (usernameDeviceDuplicate) {
        throw new BadRequestException('usernameDevice already');
      }
      const topicsDuplicates = await this.deviceModel.findOne({
        topics: { $in: updateDeviceDto.topics },
        userID,
      });

      if (topicsDuplicates) {
        throw new BadRequestException('One or more topics already exist');
      }
      const device = await this.deviceModel.findByIdAndUpdate(
        { _id: id, userID },
        { $set: updateDeviceDto },
        { new: true },
      );

      if (!device) {
        throw new NotFoundException('Device not found');
      }

      return this.mapToDeviceResponseDto(device);
    } catch (error) {
      throw error;
    }
  }

  async delete(id: string, userID: string): Promise<void> {
    try {
      // Check if the device exists
      const device = await this.deviceModel.findOne({ _id: id, userID });
      if (!device) {
        throw new NotFoundException('Device not found');
      }
      await this.deviceModel.deleteOne({ _id: id, userID });
    } catch (error) {
      throw error;
    }
  }

  async setPermission(
    permission: Permission,
    userID: string,
    deviceID: string,
  ) {
    try {
      const device = await this.deviceModel.findOneAndUpdate(
        {
          _id: deviceID,
          userID,
        },
        {
          permission,
        },
        { new: true },
      );
      if (!device) {
        throw new NotFoundException('not found device');
      }
      return this.mapToDeviceResponseDto(device);
    } catch (error) {
      throw error;
    }
  }

  async setStoreData(isSaveData: boolean, userID: string, deviceID: string) {
    try {
      const device = await this.deviceModel.findOneAndUpdate(
        {
          _id: deviceID,
          userID,
        },
        {
          isSaveData,
        },
        { new: true },
      );
      if (!device) {
        throw new NotFoundException('not found device');
      }
      return this.mapToDeviceResponseDto(device);
    } catch (error) {
      throw error;
    }
  }
}
