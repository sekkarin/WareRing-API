import { OnQueueCompleted, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
// import { AuthService } from './auth.service';
import { WinstonLoggerService } from 'src/logger/logger.service';
import { WebhookService } from './webhook.service';

@Processor('webhooksQueue')
export class WebhooksConsumer {
  constructor(
    private readonly webhooksService: WebhookService,
    private readonly logger: WinstonLoggerService,
  ) {}

  @Process('save-data')
  async sendEmailVerifyQueue(job: Job) {
    const { device, toObject } = job.data;
    try {
      // console.log(device, toObject);
      const isSaveData = await this.webhooksService.insertData(
        device,
        toObject,
      );

      if (isSaveData) {
        return isSaveData;
      }
    } catch (error) {
      throw error;
    }
  }
}
