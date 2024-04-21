import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HttpModule } from '@nestjs/axios';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LoggerMiddleware } from './utils/middlewares/logger.middleware';
import configuration from './../conf/configuration';
import { DeviceModule } from './device/device.module';
import { ApiModule } from './api/api.module';
import { WidgetModule } from './widget/widget.module';
import { WebhookModule } from './webhook/webhook.module';
import { BullModule } from '@nestjs/bull';

const configService = new ConfigService();

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [configuration],
    }),
    DeviceModule,
    ApiModule,
    HttpModule,
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: configService.get<string>('EMAIL_AUTH'),
          pass: configService.get<string>('PASS_AUTH'),
        },
      },
    }),
    WidgetModule,
    WebhookModule,
    CacheModule.register({
      isGlobal: true,
    }),
    BullModule.forRoot({
      redis: {
        port: 6379,
      },
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
