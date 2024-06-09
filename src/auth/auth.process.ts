import { OnQueueCompleted, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AuthService } from './auth.service';
import { WinstonLoggerService } from 'src/logger/logger.service';

@Processor('sendEmailVerify')
export class AuthConsumer {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: WinstonLoggerService,
  ) {}
  @Process('send-email-verify')
  async sendEmailVerifyQueue(job: Job) {
    const { email } = job.data;
    this.logger.info(
      `Processing send-email-verify job for email: ${email}`,
      AuthConsumer.name,
    );
    try {
      const sendEmail = await this.authService.sendEmailVerification(email);

      if (sendEmail) {
        this.logger.info(
          `Email verification sent to: ${email} successfully`,
          AuthConsumer.name,
        );
        return email;
      }
    } catch (error) {
      this.logger.error(
        `Failed to send email verification to: ${email} `,
        error.stack,
        AuthConsumer.name,
      );
      throw error;
    }
  }
  @Process('send-email-reset-password')
  async sendEmailResetPasswordQueue(job: Job) {
    const { email } = job.data;
    this.logger.info(
      `Processing send-email-reset-password job for email: ${email}`,
      AuthConsumer.name,
    );
    try {
      const sendEmail = await this.authService.sendMailResetPassword(email);

      if (sendEmail) {
        this.logger.info(
          `Password reset email sent to: ${email} successfully`,
          AuthConsumer.name,
        );
        return email;
      }
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to: ${email}`,
        error.stack,
        AuthConsumer.name,
      );
      throw error;
    }
  }

  @OnQueueCompleted()
  async onQueueCompleted(job: Job, result: any) {
    this.logger.verbose(
      `${AuthConsumer.name} send email successful "${result}"`,
    );
    // console.log('job on completed: job ', job.id, ' -> result: ', result);
  }
}
