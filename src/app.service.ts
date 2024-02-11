import { Inject, Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from './users/interfaces/user.interface';
// import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

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
    await this.userModel.deleteOne({ username: 'AdminWareringCaxknsa' });
  
    const dataToSeed = [
      {
        firstName: 'admin',
        lastName: 'admin',
        username: 'AdminWareringCaxknsa',
        password:
          '$2b$10$aBDeggbEBROiCQejjrKcxeoHUEVQawoTcKlbDZ1qcsCKcA.uZVO4m',
        email: 'admin@admin.com',
        roles: ['user', 'admin'],
        tokenEMQX: token,
        isActive: true,
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
          username: this.configService.get<string>(
            'EMQX_DASHBOARD_ADMIN_USERNAME',
          ),
          password: this.configService.get<string>(
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
