import { Module } from '@nestjs/common';
import { SwaggerModule } from './swagger/swagger.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from './config/config.module';
import { ServiceModule } from './service/service.module';

@Module({
  imports: [SwaggerModule, DatabaseModule, ConfigModule, ServiceModule]
})
export class CommonModule {}
