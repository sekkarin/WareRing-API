import {
  ConflictException,
  Inject,
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Model } from 'mongoose';
import { Device } from './interface/device.interface';
import * as bcrypt from 'bcrypt';
import { DeviceResponseDto } from './dto/response-device.dto';

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
      throw new BadRequestException('Device with this usernameDevice already exists');
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
  ): Promise<DeviceResponseDto[]> {
    try {
      const totalItems = await this.deviceModel.countDocuments();
      const totalPages = Math.ceil(totalItems / perPage);
      if (page > totalPages) {
        return [];
      }
      const devices = await this.deviceModel
        .find()
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

  findOne(id: number) {
    return `This action returns a #${id} device`;
  }

  update(id: number, updateDeviceDto: UpdateDeviceDto) {
    return `This action updates a #${id} device`;
  }

  remove(id: number) {
    return `This action removes a #${id} device`;
  }
}
