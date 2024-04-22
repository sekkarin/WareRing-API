import { Module } from '@nestjs/common';

import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { deviceProviders } from './provider/provider';
import { DatabaseModule } from './../database/database.module';
import { RateLimiterModule } from 'nestjs-rate-limiter';
@Module({
  controllers: [DeviceController],
  providers: [DeviceService, ...deviceProviders],
  imports: [DatabaseModule,RateLimiterModule],
})
export class DeviceModule {}
