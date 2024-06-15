import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

import { User } from './users/interfaces/user.interface';
import { WinstonLoggerService } from './logger/logger.service';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  constructor(
    @Inject('USER_MODEL')
    private userModel: Model<User>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly logger: WinstonLoggerService,
  ) {}
  async seedData() {
    this.logger.info('Seeding data process started.', AppService.name);

    const { token } = await this.loginDashboard();
    const admin = await this.userModel.findOne({
      username: 'AdminWareringCaxknsa',
    });
    if (admin) {
      this.logger.info(
        'Admin user already exists. Seed data process completed.',
        AppService.name,
      );
      return;
    }
    this.logger.info(
      'Admin user not found. Proceeding with data seeding.',
      AppService.name,
    );
    const dataToSeed = [
      {
        firstName: 'admin',
        lastName: 'admin',
        username: 'AdminWareringCaxknsa',
        password:
          '$2b$10$aBDeggbEBROiCQejjrKcxeoHUEVQawoTcKlbDZ1qcsCKcA.uZVO4m',
        email: 'admin@admin.com',
        roles: ['admin'],
        tokenEMQX: token,
        isActive: true,
        verifired: true,
      },
    ];
    const findUser = await this.userModel.findOne({
      username: dataToSeed[0].username,
    });
    if (findUser) {
      return;
    }
    await this.userModel.insertMany(dataToSeed);
    this.logger.info(
      'Data seeding process completed successfully.',
      AppService.name,
    );
  }

  async onApplicationBootstrap() {
    try {
      await this.seedData();
    } catch (error) {
      console.log(error);
    }
  }
  private async loginDashboard() {
    try {
      const res = await this.httpService.axiosRef.post(
        this.configService.get<string>('EMQX_API') + '/login',
        {
          username: this.configService.getOrThrow<string>(
            'EMQX_DASHBOARD_ADMIN_USERNAME',
          ),
          password: this.configService.getOrThrow<string>(
            'EMQX_DASHBOARD_ADMIN_PASSWORD',
          ),
        },
      );
      return { token: res.data.token };
    } catch (error) {
      throw error;
    }
  }
}
