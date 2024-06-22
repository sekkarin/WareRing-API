import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from './../users/users.module';
import { AuthConsumer } from './auth.process';
import { AuthGuard } from './guards/auth.guard';

const configService = new ConfigService();
@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthConsumer, AuthGuard],
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
    }),
    BullModule.registerQueue({
      name: 'sendEmailVerify',
    }),
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
    
  ],
})
export class AuthModule {}
