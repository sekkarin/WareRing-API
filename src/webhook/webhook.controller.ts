import {
  Body,
  CacheTTL,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { ApiTags } from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { SkipThrottle } from '@nestjs/throttler';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
@Controller('webhooks')
@ApiTags('Webhooks')
@SkipThrottle()
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    @InjectQueue('webhooksQueue') private webhooksQueue: Queue,
  ) {}

  @Post('/save')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(CacheInterceptor)
  async saveData(@Body() body: any) {
    const {device,toObject} = await this.webhookService.save(body);
    await this.webhooksQueue.add(
      'save-data',
      {
        device,
        toObject
      },
      {
        removeOnComplete: true,
        removeOnFail: true,
        
      },
    );
    return toObject
  }
}
