import { Module } from '@nestjs/common';
import { ApiService } from './api.service';
import { ApiController } from './api.controller';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from './../database/database.module';
import { deviceProviders } from './../device/provider/provider';
import { userProviders } from './../users/provider/user.providers';

@Module({
  controllers: [ApiController],
  providers: [ApiService, ...deviceProviders, ...userProviders],
  exports: [ApiService],
  imports: [HttpModule, DatabaseModule],
})
export class ApiModule {}
