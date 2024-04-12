import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('webhooks')
@ApiTags('Webhooks')
@SkipThrottle()
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('/save')
  @HttpCode(HttpStatus.OK)
  saveDate(@Req() req: Request, @Body() body: any) {
    // console.log(body);
    return this.webhookService.save(body)
  }
}
