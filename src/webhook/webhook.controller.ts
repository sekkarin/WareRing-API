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
import { SkipThrottle } from '@nestjs/throttler';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller('webhooks')
@ApiTags('Webhooks')
@SkipThrottle()
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('/save')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(CacheInterceptor)
  saveDate(@Body() body: any) {
    return this.webhookService.save(body);
  }
}
