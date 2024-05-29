import { Test, TestingModule } from '@nestjs/testing';
import { AuthConsumer } from './auth.process';
import { AuthService } from './auth.service';
import { WinstonLoggerService } from 'src/logger/logger.service';
import { Job } from 'bull';
import { NotFoundException } from '@nestjs/common';

describe('AuthConsumer', () => {
  let authConsumer: AuthConsumer;
  let authService: AuthService;
  let logger: WinstonLoggerService;

  const mockAuthService = {
    sendEmailVerification: jest.fn(),
    sendMailResetPassword: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    verbose: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthConsumer,
        { provide: AuthService, useValue: mockAuthService },
        { provide: WinstonLoggerService, useValue: mockLogger },
      ],
    }).compile();

    authConsumer = module.get<AuthConsumer>(AuthConsumer);
    authService = module.get<AuthService>(AuthService);
    logger = module.get<WinstonLoggerService>(WinstonLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmailVerifyQueue', () => {
    it('should process send-email-verify job successfully', async () => {
      const email = 'test@example.com';
      const job = { data: { email } } as Job;

      mockAuthService.sendEmailVerification.mockResolvedValue(true);

      const result = await authConsumer.sendEmailVerifyQueue(job);

      expect(authService.sendEmailVerification).toHaveBeenCalledWith(email);
      expect(logger.info).toHaveBeenCalledTimes(2);
      expect(logger.info).toHaveBeenCalledWith(
        `Processing send-email-verify job for email: ${email}`,
        AuthConsumer.name,
      );
      expect(logger.info).toHaveBeenCalledWith(
        `Email verification sent to: ${email} successfully`,
        AuthConsumer.name,
      );
      expect(result).toBe(email);
    });

    it('should handle error in send-email-verify job', async () => {
      const email = 'test@example.com';
      const job = { data: { email } } as Job;
      const error = new Error('Failed to send email verification');

      mockAuthService.sendEmailVerification.mockRejectedValue(error);

      await expect(authConsumer.sendEmailVerifyQueue(job)).rejects.toThrow(
        error,
      );

      expect(authService.sendEmailVerification).toHaveBeenCalledWith(email);
      expect(logger.info).toHaveBeenCalledWith(
        `Processing send-email-verify job for email: ${email}`,
        AuthConsumer.name,
      );
      expect(logger.error).toHaveBeenCalledWith(
        `Failed to send email verification to: ${email} `,
        error.stack,
        AuthConsumer.name,
      );
    });
  });

  describe('sendEmailResetPasswordQueue', () => {
    it('should process send-email-reset-password job successfully', async () => {
      const email = 'test@example.com';
      const job = { data: { email } } as Job;

      mockAuthService.sendMailResetPassword.mockResolvedValue(true);

      const result = await authConsumer.sendEmailResetPasswordQueue(job);

      expect(authService.sendMailResetPassword).toHaveBeenCalledWith(email);
      expect(logger.info).toHaveBeenCalledTimes(2);
      expect(logger.info).toHaveBeenCalledWith(
        `Processing send-email-reset-password job for email: ${email}`,
        AuthConsumer.name,
      );
      expect(logger.info).toHaveBeenCalledWith(
        `Password reset email sent to: ${email} successfully`,
        AuthConsumer.name,
      );
      expect(result).toBe(email);
    });

    it('should handle error in send-email-reset-password job', async () => {
      const email = 'test@example.com';
      const job = { data: { email } } as Job;
      const error = new Error('Failed to send password reset email');

      mockAuthService.sendMailResetPassword.mockRejectedValue(error);

      await expect(
        authConsumer.sendEmailResetPasswordQueue(job),
      ).rejects.toThrow(error);

      expect(authService.sendMailResetPassword).toHaveBeenCalledWith(email);
      expect(logger.info).toHaveBeenCalledWith(
        `Processing send-email-reset-password job for email: ${email}`,
        AuthConsumer.name,
      );
      expect(logger.error).toHaveBeenCalledWith(
        `Failed to send password reset email to: ${email}`,
        error.stack,
        AuthConsumer.name,
      );
    });
  });

  describe('onQueueCompleted', () => {
    it('should log queue completion', async () => {
      const job = {} as Job;
      const result = 'test@example.com';

      await authConsumer.onQueueCompleted(job, result);

      expect(logger.verbose).toHaveBeenCalledWith(
        `${AuthConsumer.name} send email successful "${result}"`,
      );
    });
  });
});
