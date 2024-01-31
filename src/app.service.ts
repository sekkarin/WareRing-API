import { Inject, Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from './users/interfaces/user.interface';
// import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

// const configService = new ConfigService();
@Injectable()
export class AppService {
  logger: Logger;
  constructor(
    @Inject('USER_MODEL')
    private userModel: Model<User>,
    private jwtService: JwtService,
  ) {
    this.logger = new Logger();
  }
  async seedData() {
    // const getToken = await axios.post(
    //   configService.get<string>('EMQX_API') + '/login',
    //   {
    //     username: configService.get<string>('EMQX_DASHBOARD_ADMIN_USERNAME'),
    //     password: configService.get<string>('EMQX_DASHBOARD_ADMIN_PASSWORD'),
    //   },
    // );
    // const { token } = getToken.data;
    // console.log(token);

    
    const dataToSeed = [
      {
        firstName: 'admin',
        lastName: 'admin',
        username: 'AdminWareringCaxknsa',
        password:
          '$2b$10$aBDeggbEBROiCQejjrKcxeoHUEVQawoTcKlbDZ1qcsCKcA.uZVO4m',
        email: 'admin@admin.com',
        roles: ['user', 'admin'],
        // tokenEMQX: token,
        isActive: true,
      },
    ];
    const findUser = await this.userModel.findOne({
      username: dataToSeed[0].username,
    });
    if (findUser) {
      return;
    }
    // this.jwtService.verify(findUser.tokenEMQX,{
    //   secret:"emqxsecretcookie"
    // })
    this.userModel.insertMany(dataToSeed);
  }

  async onApplicationBootstrap() {
    try {
      await this.seedData();
    } catch (error) {
      console.log(error);
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
