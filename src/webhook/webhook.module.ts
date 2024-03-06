import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { DatabaseModule } from 'src/database/database.module';
import { deviceProviders } from 'src/device/provider/provider';
import { dataProviders } from './provider/provider';

@Module({
  controllers: [WebhookController],
  providers: [WebhookService, ...deviceProviders, ...dataProviders],
  imports: [DatabaseModule],
})
export class WebhookModule {}
