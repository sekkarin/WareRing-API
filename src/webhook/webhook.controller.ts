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
import { SkipThrottle } from "@nestjs/throttler";
@Controller('webhooks')
@ApiTags('Webhooks')
@SkipThrottle()
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('/save')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(CacheInterceptor)
  saveData(@Body() body: any) {
  return this.webhookService.save(body);
  }
}
