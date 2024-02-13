import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { HttpStatusCode } from 'axios';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('/save-date')
  @HttpCode(HttpStatusCode.Ok)
  saveDate(@Req() req: Request, @Body() body: any) {
    console.log(body);
  }
}
