import { Inject, Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from './users/interfaces/user.interface';

@Injectable()
export class AppService {
  logger: Logger;
  constructor(
    @Inject('USER_MODEL')
    private userModel: Model<User>,
  ) {
    this.logger = new Logger();
  }
  async seedData() {
    const dataToSeed = [
      {
        email: 'ADMIN@ADMIN.com',
        password:
          '$2b$10$o7El3cJlQZkqI7GBpqgF6u.CS3DzTmhdqGvd2jDakc8iw8q8XP3e6',
        name: 'SUPER ADMIN',
        role: {
          User: 'USER',
          Admin: 'ADMIN',
        },
        username: 'ADMINBOOKS',
        isAlive: true,
        profileUrl: 'https://example.com/profile.jpg',
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

      // throw Error('Error while seeding data.');
    }
  }
}
