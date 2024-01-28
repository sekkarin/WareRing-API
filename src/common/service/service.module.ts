import { Module } from '@nestjs/common';
import { EmqxApiService } from './emqx-api/emqx-api.service';

@Module({
  providers: [EmqxApiService]
})
export class ServiceModule {}
