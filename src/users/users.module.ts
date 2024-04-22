import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { userProviders } from './provider/user.providers';
import { DatabaseModule } from './../database/database.module';
import { deviceProviders } from './../device/provider/provider';
import { RateLimiterModule } from 'nestjs-rate-limiter';


@Module({
  providers: [UsersService, ...userProviders, ...deviceProviders],
  exports: [UsersService, ...userProviders],
  imports: [
    DatabaseModule,
    RateLimiterModule
  ],
  controllers: [UsersController],
})
export class UsersModule {}
