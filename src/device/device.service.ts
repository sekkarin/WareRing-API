import { Inject, Injectable } from '@nestjs/common';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Model } from 'mongoose';
import { Device } from './interface/device.interface';
import * as bcrypt from "bcrypt";

@Injectable()
export class DeviceService {
  constructor(
    @Inject('DEVICE_MODEL')
    private deviceModel: Model<Device>,
  ) {}

async  create(createDeviceDto: CreateDeviceDto) {
    const password_hash = await bcrypt.hash("1234", 10);
    const device = new this.deviceModel({
      userID:"user1",
      nameDevice:"device1",
      usernameDevice:"d1",
      password_hash,
      description:"............",
      permission:"allow",
      subscribe:["t/*"],
      publish:["t/1"],
      action:"all",
      qos:["1"],
      retain:false,
    })
    await device.save()
    return device;
  }

  findAll() {
    return `This action returns all device`;
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
