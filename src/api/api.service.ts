import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { Model } from 'mongoose';
import { Device } from 'src/device/interface/device.interface';

@Injectable()
export class ApiService {
  private tokenEMQX: string | null = null;
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject('DEVICE_MODEL')
    private deviceModel: Model<Device>,
  ) {}
  

  private async loginDashboard() {
    try {
      const res = await this.httpService.axiosRef.post(
        this.configService.get<string>('EMQX_API') + '/login',
        {
          username: this.configService.get<string>(
            'EMQX_DASHBOARD_ADMIN_USERNAME',
          ),
          password: this.configService.get<string>(
            'EMQX_DASHBOARD_ADMIN_PASSWORD',
          ),
        },
      );
      this.tokenEMQX = res.data.token;
    } catch (error) {
      throw error;
    }
  }

  async overview(userID: string) {
    try {
      // Get device data from EMQX API
      const res = await this.fetchDeviceDataFromEMQX();
      const devicesEMQX = res.data;

      // Count total devices
      const totalDevice = await this.countTotalDevices(userID);
      const totalDeviceDeny = await this.countDeniedDevices(userID);

      // Filter and count online devices
      const { deviceOnline, deviceOffline } = await this.filterAndCountDevices(
        devicesEMQX,
        userID,
        totalDeviceDeny,
      );

      return {
        // statusCode: 200,
        deviceOffline,
        deviceOnline,
        totalDevice,
        totalDeviceDeny,
      };
    } catch (error) {
      // console.log(error);
      if (error instanceof AxiosError && error.response.status == 401) {
        await this.loginDashboard();
        return this.overview(userID);
      }

      throw error;
    }
  }
  
  private async fetchDeviceDataFromEMQX() {
    try {
      return await this.httpService.axiosRef.get(
        `${this.configService.get('EMQX_API')}/clients`,
        {
          headers: { Authorization: `Bearer ${this.tokenEMQX}` },
        },
      );
    } catch (error) {
      // console.log(error);

      throw error;
    }
  }

  private async countTotalDevices(userID: string) {
    try {
      return await this.deviceModel.countDocuments({ userID });
    } catch (error) {
      throw error;
    }
  }

  private async countDeniedDevices(userID: string) {
    try {
      return await this.deviceModel.countDocuments({
        userID,
        permission: 'deny',
      });
    } catch (error) {
      throw error;
    }
  }

  private async filterAndCountDevices(
    devicesEMQX: any,
    userID: string,
    totalDeviceDeny: number,
  ) {
    try {
      const devices = await this.deviceModel.find({
        userID,
        permission: 'allow',
      });
      const devicesInfo = devices
        .map((device) =>
          devicesEMQX.data.find(
            (deviceEMQX) =>
              deviceEMQX.username === device.usernameDevice &&
              deviceEMQX.connected === true,
          ),
        )
        .filter((deviceInfo) => deviceInfo !== undefined);

      const deviceOnline = devicesInfo.length;
      const totalDevice = await this.countTotalDevices(userID);

      return {
        deviceOnline,
        deviceOffline: totalDevice - deviceOnline - totalDeviceDeny,
      };
    } catch (error) {
      throw error;
    }
  }
}
