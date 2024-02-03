import { Module } from '@nestjs/common';
import { ApiService } from './api.service';
import { ApiController } from './api.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  controllers: [ApiController],
  providers: [ApiService],
  exports:[ApiService],
  imports:[HttpModule,]
})
export class ApiModule {}
