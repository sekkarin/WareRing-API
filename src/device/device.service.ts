import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Device } from './interface/device.interface';
import { DeviceResponseDto } from './dto/response-device.dto';
import { Permission } from './types/permission.type';
import { PaginatedDto } from '../utils/dto/paginated.dto';
import { GetDevicesFilterDto } from './dto/get-device-filter.dto';
import { LoggerService } from 'src/logger/logger.service';

@Injectable()
export class DeviceService {
  constructor(
    @Inject('DEVICE_MODEL')
    private deviceModel: Model<Device>,
  ) {}
  private readonly logger = new LoggerService(DeviceService.name);
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
      password_law: createDeviceDto.password,
      userID,
      topics: topicsGenerated,
    });
    await device.save();
    this.logger.log(`user ${userID} create device successfully`);
    return this.mapToDeviceResponseDto(device);
  }

  private mapToDeviceResponseDto(device: Device): DeviceResponseDto {
    return {
      id: device.id,
      userID: device.userID,
      nameDevice: device.nameDevice,
      usernameDevice: device.usernameDevice,
      password: device.password_law,
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
    query = '',
    page = 1,
    limit = 10,
    userID: string,
    getDevicesSortDto: string,
    getDevicesFilterDto: GetDevicesFilterDto,
  ) {
    try {
      let options = {};
      ({ options, getDevicesFilterDto } = this.getFilter(getDevicesFilterDto));

      const itemCount = await this.deviceModel.countDocuments({
        userID,
      });
      let devicesQuery = this.deviceModel.find({
        userID,
        $or: [
          { nameDevice: { $regex: query, $options: 'i' } },
          { usernameDevice: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ],
        ...options,
      });

      devicesQuery = this.getSort(getDevicesSortDto, devicesQuery);
      const devices = await devicesQuery.skip((page - 1) * limit).limit(limit);

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
      throw error;
    }
  }

  private getSort(getDevicesSortDto: string, devicesQuery: any) {
    console.log(getDevicesSortDto);

    if (getDevicesSortDto) {
      devicesQuery = devicesQuery.sort(getDevicesSortDto);
    } else {
      devicesQuery = devicesQuery.sort({ createdAt: -1 });
    }
    return devicesQuery;
  }

  private getFilter(getDevicesFilterDto: GetDevicesFilterDto) {
    let options = {};

    getDevicesFilterDto = this.removeUndefined(getDevicesFilterDto);

    if (getDevicesFilterDto) {
      options = { ...getDevicesFilterDto };
    }
    return { options, getDevicesFilterDto };
  }

  private removeUndefined<T>(obj: T): T {
    const newObj = {} as T;
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        newObj[key] = obj[key];
      }
    }
    return newObj;
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
    let topicsGenerated: string[];
    let password_hash: string;
    let password_law: string | null = null;
    try {
      const existingDeviceUsername = await this.deviceModel.findOne({
        usernameDevice: updateDeviceDto.usernameDevice,
        userID,
      });
      if (existingDeviceUsername) {
        throw new BadRequestException('usernameDevice already');
      }
      if (updateDeviceDto.topics) {
        topicsGenerated = [
          `${userID}/${updateDeviceDto.topics}/publish`,
          `${userID}/${updateDeviceDto.topics}/subscribe`,
        ];
      }
      const existingTopics = await this.deviceModel.find({
        topics: { $in: topicsGenerated },
      });

      if (existingTopics.length > 0) {
        throw new BadRequestException(
          'Topics already assigned to another device',
        );
      }
      if (updateDeviceDto.password) {
        password_hash = await bcrypt.hash(updateDeviceDto.password, 10);
        password_law = updateDeviceDto.password;
      }
      const device = await this.deviceModel.findByIdAndUpdate(
        { _id: id, userID },
        {
          $set: {
            ...updateDeviceDto,
            topics: topicsGenerated,
            password_hash,
            password_law,
          },
        },
        { new: true },
      );

      if (!device) {
        throw new NotFoundException('Device not found');
      }
      this.logger.log(`user ${userID} update device successfully`);
      return this.mapToDeviceResponseDto(device);
    } catch (error) {
      throw error;
    }
  }

  async delete(id: string, userID: string) {
    const device = await this.deviceModel.findOneAndDelete({ _id: id, userID });
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    this.logger.log(`user ${userID} delete device successfully`);
    return device;
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
      this.logger.log(`user ${userID} update permission device successfully`);
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
      this.logger.log(`user ${userID} update save data device successfully`);
      return this.mapToDeviceResponseDto(device);
    } catch (error) {
      throw error;
    }
  }

  async searchDevices(query: string, userID: string, page = 1, limit = 10) {
    // page = 1,
    // limit = 10,
    // userID: string,
    // getDevicesSortDto: string,
    // getDevicesFilterDto: GetDevicesFilterDto,
    const itemCount = await this.deviceModel
      .find({
        userID: userID,
        $or: [
          { nameDevice: { $regex: query, $options: 'i' } },
          { usernameDevice: { $regex: query, $options: 'i' } },
        ],
      })
      .countDocuments();
    const devices = await this.deviceModel
      .find({
        userID: userID,
        $or: [
          { nameDevice: { $regex: query, $options: 'i' } },
          { usernameDevice: { $regex: query, $options: 'i' } },
        ],
      })
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
  }
}
