import { Module } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { ApiKeyController } from './api-key.controller';
import { apiKeyProviders } from './provider/provider';
import { DatabaseModule } from 'src/database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [ApiKeyController],
  providers: [ApiKeyService, ...apiKeyProviders],
  imports: [
    DatabaseModule,
    JwtModule.register({
      global: true,
    }),
  ],
  
})
export class ApiKeyModule {}
