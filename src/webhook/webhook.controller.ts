import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { WebhookService } from './webhook.service';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('/save-date')
  @HttpCode(HttpStatus.OK)
  saveDate(@Req() req: Request, @Body() body: any) {
    console.log(body);
  }
}
