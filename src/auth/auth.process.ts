import {
  OnQueueCompleted,
  Process,
  Processor,
} from '@nestjs/bull';
import { Job } from 'bull';
import { AuthService } from './auth.service';

@Processor('sendEmailVerify')
export class AuthConsumer {
  constructor(private readonly authService: AuthService) {}
  @Process('send-email-verify')
  async sendEmailVerifyQueue(job: Job) {
    const { email } = job.data;
    try {
      const sendEmail = await this.authService.sendEmailVerification(email);
      console.log(sendEmail);
      
      if (sendEmail) {
        return email;
      }
    } catch (error) {
      throw error
    }
  }

  @OnQueueCompleted()
  async onQueueCompleted(job: Job, result: any) {
    console.log('job on completed: job ', job.id, ' -> result: ', result);
  }
 
}
