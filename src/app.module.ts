import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LoggerMiddleware } from './utils/logger.middleware';
import { ConfigModule } from '@nestjs/config';
import configuration from './../conf/configuration';
import { DeviceModule } from './device/device.module';
import { ApiModule } from './api/api.module';
import { HttpModule } from '@nestjs/axios';
import { WebhookModule } from './webhook/webhook.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:[configuration]
    }),
    DeviceModule,
    ApiModule,
    HttpModule,
    WebhookModule
    
  ],
  // controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
