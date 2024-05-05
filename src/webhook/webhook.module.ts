import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { DatabaseModule } from 'src/database/database.module';
import { deviceProviders } from 'src/device/provider/provider';
import { dataProviders } from './provider/provider';
import { BullModule } from '@nestjs/bull';
import { WebhooksConsumer } from './webhooks.process';

@Module({
  controllers: [WebhookController],
  providers: [
    WebhookService,
    ...deviceProviders,
    ...dataProviders,
    WebhooksConsumer,
  ],
  imports: [
    DatabaseModule,
    BullModule.registerQueue({
      name: 'webhooksQueue',
    }),
  ],
  exports:[
    ...dataProviders
  ]
})
export class WebhookModule {}
