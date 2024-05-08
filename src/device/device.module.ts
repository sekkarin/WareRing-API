import { Module } from '@nestjs/common';

import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { deviceProviders } from './provider/provider';
import { DatabaseModule } from './../database/database.module';
import { userProviders } from 'src/users/provider/user.providers';
import { widgetProviders } from 'src/widget/provider/provider';
@Module({
  controllers: [DeviceController],
  providers: [
    DeviceService,
    ...deviceProviders,
    ...userProviders,
    ...widgetProviders,
  ],
  imports: [DatabaseModule],
})
export class DeviceModule {}
