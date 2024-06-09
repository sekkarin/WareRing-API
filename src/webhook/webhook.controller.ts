import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ApiKeyGuard } from './guards/api-key.guard';
import { AuthDeviceDto } from './dto/auth-device.dto';
import { AuthzDeviceDto } from './dto/authz-device.dto';
@Controller('webhooks')
@ApiTags('Webhooks')
@SkipThrottle()
@UseGuards(ApiKeyGuard)
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    @InjectQueue('webhooksQueue') private webhooksQueue: Queue,
  ) {}

  @Post('/save')
  @HttpCode(HttpStatus.OK)
  async saveData(@Body() body: any) {
    const { device, toObject } = await this.webhookService.save(body);
    await this.webhooksQueue.add(
      'save-data',
      {
        device,
        toObject,
      },
      {
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
    return toObject;
  }
  @Post('/auth-device')
  @HttpCode(HttpStatus.OK)
  async authDevice(@Body() body: AuthDeviceDto) {
    console.log(body.clientId);

    const authDevice = await this.webhookService.authenticationDevice(body);
    return authDevice;
  }
  @Post('/authz-device')
  @HttpCode(HttpStatus.OK)
  async authzDevice(@Body() body: AuthzDeviceDto) {
    const authorizationDevice = await this.webhookService.authorizationDevice(
      body,
    );
    return authorizationDevice;
  }
}
