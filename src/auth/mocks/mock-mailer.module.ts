// mock-mailer.module.ts
import { Module } from '@nestjs/common';
import { MockMailerService } from './mock-mailer.service';

@Module({
  providers: [
    {
      provide: 'MailerService',
      useClass: MockMailerService,
    },
  ],
  exports: ['MailerService'],
})
export class MockMailerModule {}
