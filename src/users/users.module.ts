import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { userProviders } from './provider/user.providers';
import { DatabaseModule } from './../database/database.module';
import { deviceProviders } from './../device/provider/provider';


@Module({
  providers: [UsersService, ...userProviders, ...deviceProviders],
  exports: [UsersService, ...userProviders],
  imports: [
    DatabaseModule,
  ],
  controllers: [UsersController],
})
export class UsersModule {}
