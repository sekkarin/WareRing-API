import { Inject, Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

import { User } from './users/interfaces/user.interface';

@Injectable()
export class AppService {
  logger: Logger;
  constructor(
    @Inject('USER_MODEL')
    private userModel: Model<User>,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.logger = new Logger();
  }
  async seedData() {
    const { token } = await this.loginDashboard();
    const admin = await this.userModel.findOne({
      username: 'AdminWareringCaxknsa',
    });
    if (admin) {
      return;
    }

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
      {
        firstName: 'John',
        lastName: 'Doe',
        username: 'ken',
        password:
          '$2b$10$E8BhNJ0UY2fet5LbhX0uZOoqeOwuouU/fEfqhrA8GMWLYOr475GHq',
        email: 'sekkri1234@gmail.com',
        roles: ['user'],
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
    this.userModel.insertMany(dataToSeed);
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

  // create login  admin emqx
  // create user
  // "api_key": "c0049e401dbcf3d3",
  // "api_secret": "YYFSbhNOUR6bSGN1Ibh9AhAK4u0sqO6RSxk6KTbtU3TH",

  // curl -X GET http://localhost:18083/api/v5/nodes \
  // -u 0023f119f5c7e0b4:oGWf6pcZx0wz9BzG9CKf7izliwqNnkX1J3c6f74SwplcG \
  // -H "Content-Type: application/json"
}
