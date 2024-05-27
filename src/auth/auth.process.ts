import { OnQueueCompleted, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AuthService } from './auth.service';
import { LoggerService } from 'src/logger/logger.service';

@Processor('sendEmailVerify')
export class AuthConsumer {
  constructor(private readonly authService: AuthService) {}
  private readonly logger = new LoggerService(AuthConsumer.name);
  @Process('send-email-verify')
  async sendEmailVerifyQueue(job: Job) {
    const { email } = job.data;
    try {
      const sendEmail = await this.authService.sendEmailVerification(email);

      if (sendEmail) {
        return email;
      }
    } catch (error) {
      throw error;
    }
  }
  @Process('send-email-reset-password')
  async sendEmailResetPasswordQueue(job: Job) {
    const { email } = job.data;
    try {
      const sendEmail = await this.authService.sendMailResetPassword(email);

      if (sendEmail) {
        return email;
      }
    } catch (error) {
      throw error;
    }
  }

  @OnQueueCompleted()
  async onQueueCompleted(job: Job, result: any) {
    this.logger.verbose(
      `${AuthConsumer.name} send email  successful "${result}"`,
    );
    // console.log('job on completed: job ', job.id, ' -> result: ', result);
  }
}
