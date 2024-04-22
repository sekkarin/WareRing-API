import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from './../users/users.module';
import { BullModule } from '@nestjs/bull';
import { AuthConsumer } from './auth.process';
import { LoggerService } from 'src/logger/logger.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthConsumer],
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
    }),
    BullModule.registerQueue({
      name: 'sendEmailVerify',
    })
  ],
})
export class AuthModule {}
