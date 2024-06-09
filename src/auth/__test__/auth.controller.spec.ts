import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';
import { AuthController } from '../auth.controller';
import { getQueueToken } from '@nestjs/bull';
import { AuthGuard } from '../guards/auth.guard';
import { IsActivateUser } from 'src/users/guard/active.guard';
import { Request, Response } from 'express'; // Import Response from express
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/user.dto';
import { Error } from 'mongoose';
import { WinstonLoggerService } from 'src/logger/logger.service';

describe('AuthController', () => {
  let authService: AuthService;
  let authController: AuthController;

  const mockConfigService = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };
  const mockAuthService = {
    checkIsActive: jest.fn(),
    signIn: jest.fn(),
    signUp: jest.fn(),
    logOut: jest.fn(),
    refresh: jest.fn(),
    verifyEmail: jest.fn(),
    sendEmailForgetPassword: jest.fn(),
    resetPassword: jest.fn(),
  };
  const mockAuthGuardService = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };
  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;
  const mockQueue = {
    add: jest.fn(),
  };
  const MockLoggerService = {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
  const mockRequest = {
    user: {
      username: 'testUser',
    },
    cookies: {
      refresh_token: 'test',
    },
  } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: getQueueToken('sendEmailVerify'),
          useValue: mockQueue, // Mock the queue object as needed
        },
        {
          provide: WinstonLoggerService,
          useValue: MockLoggerService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuardService)
      .overrideGuard(IsActivateUser)
      .useValue(mockAuthGuardService)
      .compile();

    authService = module.get<AuthService>(AuthService);
    authController = module.get<AuthController>(AuthController);
  });
  it('should be defined', () => {
    expect(authController).toBeDefined();
  });
  describe('signIn', () => {
    const mockIp = '127.0.0.1';
    const mockSignInDto = { username: 'testUser', password: 'password' };
    const mockUser = {
      username: 'testUser',
      access_token: 'accessToken',
      refresh_token: 'refreshToken',
    };

    it('should sign in user and set refresh token cookie', async () => {
      const mockExpiresIn = 6 * 24 * 60 * 60; // 6 days in seconds
      const mockMaxAgeMilliseconds = 44789760000000;

      mockAuthService.checkIsActive.mockResolvedValueOnce(true);
      mockAuthService.signIn.mockResolvedValueOnce(mockUser);
      mockConfigService.getOrThrow.mockReturnValueOnce(mockExpiresIn);

      await authController.signIn(mockIp, mockSignInDto, mockResponse as any);

      expect(mockAuthService.checkIsActive).toHaveBeenCalledWith(
        mockSignInDto.username,
      );
      expect(mockAuthService.signIn).toHaveBeenCalledWith(
        mockSignInDto.username,
        mockSignInDto.password,
      );
      expect(mockConfigService.getOrThrow).toHaveBeenCalledWith(
        'EXPIRES_IN_COOKIES_REFRESH_TOKEN',
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        mockUser.refresh_token,
        {
          httpOnly: true,
          sameSite: 'none',
          secure: true,
          maxAge: mockMaxAgeMilliseconds,
        },
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        access_token: mockUser.access_token,
      });
    });

    it('should throw UnauthorizedException when user is not active', async () => {
      mockAuthService.checkIsActive.mockResolvedValueOnce(false);

      await expect(
        authController.signIn(mockIp, mockSignInDto, mockResponse),
      ).rejects.toThrowError(new UnauthorizedException('User is banned'));

      expect(mockAuthService.checkIsActive).toHaveBeenCalledWith(
        mockSignInDto.username,
      );
    });

    it('should throw UnauthorizedException when signIn throws UnauthorizedException', async () => {
      mockAuthService.checkIsActive.mockResolvedValueOnce(true);
      mockAuthService.signIn.mockRejectedValueOnce(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(
        authController.signIn(mockIp, mockSignInDto, mockResponse),
      ).rejects.toThrowError(new UnauthorizedException('Invalid credentials'));
    });
  });
  describe('register', () => {
    it('should register user successfully', async () => {
      const mockIp = '127.0.0.1';
      const mockSignUpDto: CreateUserDto = {
        username: 'testUser',
        email: 'test@example.com',
        password: 'password',
      };
      const mockResult = { ...mockSignUpDto, id: 'mockId' };

      mockAuthService.signUp.mockResolvedValueOnce(mockResult);

      await authController.signUp(mockIp, mockSignUpDto);

      expect(mockAuthService.signUp).toHaveBeenCalledWith(mockSignUpDto);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-email-verify',
        { email: mockResult.email },
        {
          attempts: 3,
          priority: 2,
          removeOnComplete: true,
          removeOnFail: true,
          delay: 1000,
        },
      );
    });

    it('should throw error when registration fails', async () => {
      const mockIp = '127.0.0.1';
      const mockSignUpDto: CreateUserDto = {
        username: 'testUser',
        email: 'test@example.com',
        password: 'password',
      };

      mockAuthService.signUp.mockRejectedValueOnce(
        new UnauthorizedException('Registration failed'),
      );

      await expect(
        authController.signUp(mockIp, mockSignUpDto),
      ).rejects.toThrowError(new UnauthorizedException('Registration failed'));

      expect(mockAuthService.signUp).toHaveBeenCalledWith(mockSignUpDto);
      expect(mockQueue.add).toHaveBeenCalled();
    });

    describe('logOut', () => {
      it('should log out user successfully and clear refresh token cookie', async () => {
        mockAuthService.logOut.mockResolvedValueOnce({ _id: 'user' });

        await authController.logOut(mockRequest, mockResponse);
        expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: "logout's" });
      });

      it('should throw UnauthorizedException when user is not logged in', async () => {
        mockRequest.user.username = undefined;
        jest
          .spyOn(authService, 'logOut')
          .mockImplementation(() =>
            Promise.reject(new UnauthorizedException('User not logged in')),
          );
        await expect(
          authController.logOut(mockRequest, mockResponse),
        ).rejects.toThrowError(new UnauthorizedException('User not logged in'));
      });
    });
  });
  describe('refresh', () => {
    it('should refresh access token successfully', async () => {
      mockRequest.cookies.refresh_token = 'mockRefreshToken';
      mockAuthService.refresh.mockResolvedValueOnce('mockAccessToken');

      await authController.refresh(mockRequest, mockResponse);

      expect(mockAuthService.refresh).toHaveBeenCalledWith('mockRefreshToken');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        access_token: 'mockAccessToken',
      });
    });

    it('should throw UnauthorizedException when refresh token is missing', async () => {
      delete mockRequest.cookies.refresh_token;

      await expect(
        authController.refresh(mockRequest, mockResponse),
      ).rejects.toThrowError(new UnauthorizedException());
    });
  });
  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const mockToken = 'mockToken';
      mockAuthService.verifyEmail.mockResolvedValueOnce({
        email: 'test@example.com',
      });

      await authController.verifyEmail(mockToken, mockResponse);

      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(mockToken);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        msg: 'Your email is verifired',
      });
    });

    it('should throw UnauthorizedException when token is not valid', async () => {
      const mockToken = 'invalidToken';
      mockAuthService.verifyEmail.mockRejectedValueOnce(
        new UnauthorizedException(),
      );

      await expect(
        authController.verifyEmail(mockToken, mockResponse),
      ).rejects.toThrowError(new UnauthorizedException());

      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(mockToken);
    });
  });
  describe('sendEmailForgetPassword', () => {
    it('should send email for forget password successfully', async () => {
      const mockEmail = 'test@example.com';
      mockAuthService.sendEmailForgetPassword.mockResolvedValueOnce(true);

      await authController.sendEmailForgetPassword(mockEmail, mockResponse);

      expect(mockAuthService.sendEmailForgetPassword).toHaveBeenCalledWith(
        mockEmail,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        msg: 'LOGIN_EMAIL_RESENT',
      });
    });

    // it('should handle unauthorized when email not sent', async () => {
    //   const mockEmail = 'test@example.com';
    //   mockAuthService.sendEmailForgetPassword.mockResolvedValueOnce(false);

    //   await authController.sendEmailForgetPassword(mockEmail, mockResponse);

    //   expect(mockAuthService.sendEmailForgetPassword).toHaveBeenCalledWith(
    //     mockEmail,
    //   );
    //   expect(mockResponse.status).toHaveBeenCalledWith(401);
    //   expect(mockResponse.json).toHaveBeenCalledWith({
    //     msg: 'REGISTRATION_ERROR_MAIL_NOT_SENT',
    //   });
    // });

    it('should handle error when email not found', async () => {
      const mockEmail = 'nonexistent@example.com';
      mockAuthService.sendEmailForgetPassword.mockRejectedValueOnce(
        new NotFoundException(),
      );

      await authController.sendEmailForgetPassword(mockEmail, mockResponse);

      expect(mockAuthService.sendEmailForgetPassword).toHaveBeenCalledWith(
        mockEmail,
      );
    });

    it('should handle general error', async () => {
      const mockEmail = 'test@example.com';
      mockAuthService.sendEmailForgetPassword.mockRejectedValueOnce(
        new Error(''),
      );

      await authController.sendEmailForgetPassword(mockEmail, mockResponse);

      expect(mockAuthService.sendEmailForgetPassword).toHaveBeenCalledWith(
        mockEmail,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        msg: 'LOGIN_ERROR_SEND_EMAIL',
      });
    });
  });

  describe('setNewPassword', () => {
    it('should reset user password successfully', async () => {
      const mockToken = 'mockToken';
      const mockResetPasswordDto = { newPassword: 'newPassword' };
      mockAuthService.resetPassword.mockResolvedValueOnce({
        email: 'test@example.com',
      });

      await authController.setNewPassword(
        mockToken,
        mockResetPasswordDto,
        mockResponse,
      );

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        mockToken,
        mockResetPasswordDto.newPassword,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        msg: 'Reset your password already',
      });
    });

    it('should handle unauthorized when token is not valid', async () => {
      const mockToken = 'invalidToken';
      const mockResetPasswordDto = { newPassword: 'newPassword' };
      mockAuthService.resetPassword.mockImplementation(() =>
        Promise.reject(new ForbiddenException()),
      );

      await expect(
        authController.setNewPassword(
          mockToken,
          mockResetPasswordDto,
          mockResponse,
        ),
      ).rejects.toThrowError(ForbiddenException);
    });

    it('should handle general error', async () => {
      const mockToken = 'mockToken';
      const mockResetPasswordDto = { newPassword: 'newPassword' };
      mockAuthService.resetPassword.mockImplementation(() =>
        Promise.reject(new Error('error something')),
      );
      await expect(
        authController.setNewPassword(
          mockToken,
          mockResetPasswordDto,
          mockResponse,
        ),
      ).rejects.toThrowError(Error);
    });
  });
});
