import { Module } from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { deviceProviders } from "./provider/provider";
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [DeviceController],
  providers: [DeviceService, ...deviceProviders],
  imports: [DatabaseModule]
})
export class DeviceModule {}
