// mock-mailer.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class MockMailerService {
  async sendMail(options: any): Promise<any> {
    console.log('Mock sendMail called with options:', options);
    return {
      accepted: [options.to],
      rejected: [],
      envelopeTime: 100,
      messageTime: 200,
      messageSize: 250,
      response: '250 OK: message queued',
      envelope: {
        from: options.from,
        to: [options.to],
      },
      messageId: '<mock.message.id>',
    };
  }
}
