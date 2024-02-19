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
import { Model, Types } from 'mongoose';
import { Device } from './interface/device.interface';
import * as bcrypt from 'bcrypt';
import { DeviceResponseDto } from './dto/response-device.dto';
import { Permission } from './types/permission.type';
import { PaginatedDto } from '../utils/dto/paginated.dto';

@Injectable()
export class DeviceService {
  constructor(
    @Inject('DEVICE_MODEL')
    private deviceModel: Model<Device>,
    // private mongdb:Types
  ) {}

  async create(
    createDeviceDto: CreateDeviceDto,
    userID: string,
  ): Promise<DeviceResponseDto> {
    const existingDevice = await this.deviceModel.findOne({
      usernameDevice: createDeviceDto.usernameDevice,
    });
    const topicsGenerated = [
      `${userID}/${createDeviceDto.topics}/publish`,
      `${userID}/${createDeviceDto.topics}/subscribe`,
    ];

    const existingTopics = await this.deviceModel.find({
      topics: { $in: topicsGenerated },
    });

    if (existingTopics.length > 0) {
      throw new BadRequestException(
        'Topics already assigned to another device',
      );
    }

    if (existingDevice) {
      throw new BadRequestException(
        'Device with this usernameDevice already exists',
      );
    }
    const password_hash = await bcrypt.hash(createDeviceDto.password, 10);
    const device = new this.deviceModel({
      ...createDeviceDto,
      password_hash,
      userID,
      topics: topicsGenerated,
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

  async findAll(page = 1, limit = 10, userID: string) {
    try {
      const itemCount = await this.deviceModel.countDocuments({ userID });
      const devices = await this.deviceModel
        .find({ userID })
        .skip((page - 1) * limit)
        .limit(limit);

      const devicesResponse = devices.map((device) =>
        this.mapToDeviceResponseDto(device),
      );
      return new PaginatedDto<DeviceResponseDto>(
        devicesResponse,
        page,
        limit,
        itemCount,
      );
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

  async delete(id: string, userID: string) {
    const device = await this.deviceModel.findOne({ _id: id, userID });
    if (!device) {
      throw new NotFoundException('Device not found');
      // throw new HttpException('Device not found', HttpStatus.NOT_FOUND);
    }
    await this.deviceModel.deleteOne({ _id: id, userID });
    return await this.deviceModel.deleteOne({ _id: id, userID });
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

  async searchDevices(query: string, userID: string) {
    const devices = await this.deviceModel.find({
      userID: userID,
      $or: [
        { nameDevice: { $regex: query, $options: 'i' } },
        { usernameDevice: { $regex: query, $options: 'i' } },
      ],
    });
    const devicesResponse = devices.map((device) =>
      this.mapToDeviceResponseDto(device),
    );

    return devicesResponse;
  }

}
