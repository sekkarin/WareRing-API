import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HttpModule } from '@nestjs/axios';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { BullModule } from '@nestjs/bull';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LoggerMiddleware } from './utils/middlewares/logger.middleware';
import configuration from './../conf/configuration';
import { DeviceModule } from './device/device.module';
import { ApiModule } from './api/api.module';
import { WidgetModule } from './widget/widget.module';
import { WebhookModule } from './webhook/webhook.module';
import { LoggerModule } from './logger/logger.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ExportModule } from './export/export.module';
import { WinstonLoggerService } from './logger/logger.service';
import { ApiKeyModule } from './api-key/api-key.module';

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
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: configService.getOrThrow<string>('REDIS_URL'),
            port: configService.getOrThrow<number>('REDIS_PORT'),
          },
        }),
      }),
    }),
    BullModule.forRoot({
      redis: {
        host: configService.getOrThrow<string>('REDIS_URL'),
        port: configService.getOrThrow<number>('REDIS_PORT'),
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 250,
        },
      ],
      errorMessage: 'Access limited. Please try again later.',
    }),
    LoggerModule,
    DashboardModule,
    ExportModule,
    ApiKeyModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
