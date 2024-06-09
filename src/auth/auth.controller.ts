import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { WinstonLoggerService } from 'src/logger/logger.service';

import { CreateUserDto } from './../users/dto/user.dto';
import {
  AccessTokenResponseDto,
  BodyUserLoginDto,
  ResetPasswordDto,
  UserResponseDto,
} from './dto/auth.dto';
import { CustomLoggerInterceptor } from 'src/utils/interceptors/customLoggerInterceptor';

@Controller('auth')
@ApiTags('Authentication')
@UseInterceptors(CustomLoggerInterceptor)
@Throttle({ default: { limit: 3, ttl: 60000 } })
export class AuthController {
  constructor(
    private readonly authService: AuthService, // private myLogger: MyLoggerService// private jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectQueue('sendEmailVerify') private sendEmailVerifyQueue: Queue,
    private readonly logger: WinstonLoggerService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' }) // Operation summary
  @ApiResponse({
    status: 200,
    description: `User logged in successfully  access token   payload = {
      sub: string,
      username: string,
      roles:array
    } 
    EXPIRES = 6  days
    `,
    type: AccessTokenResponseDto,
    headers: {
      refresh_token: {
        description: 'Cookie to store the refresh token for authentication.',
        schema: {
          type: 'string',
        },
        example:
          'refresh_token=myRefreshToken; HttpOnly; SameSite=None; Secure; Max-Age=518,400,000 or 6 day',
      },
    },
  }) // Response description
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Array of validation error messages',
  })
  @ApiResponse({
    status: 403,
    description: 'Unauthorized - incorrect or missing credentials',
  })
  async signIn(
    @Ip() ip: string,
    @Body() signInDto: BodyUserLoginDto,
    @Res() res: Response,
  ) {
    this.logger.info(`${AuthController.name} Login attempt from IP: ${ip}`);
    try {
      const checkIsActive = await this.authService.checkIsActive(
        signInDto.username,
      );
      if (!checkIsActive) {
        this.logger.warn(`User ${signInDto.username} is banned or inactive`);
        throw new UnauthorizedException('User is banned');
      }
      const user = await this.authService.signIn(
        signInDto.username,
        signInDto.password,
      );
      const expiresInSeconds = this.configService.getOrThrow<number>(
        'EXPIRES_IN_COOKIES_REFRESH_TOKEN',
      );
      const maxAgeMilliseconds = expiresInSeconds * 24 * 60 * 60 * 1000;

      res.cookie('refresh_token', user.refresh_token, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        maxAge: maxAgeMilliseconds,
      });
      this.logger.info(
        `User ${signInDto.username} logged in successfully`,
        AuthController.name,
      );
      return res.status(200).json({ access_token: user.access_token });
    } catch (error) {
      throw error;
    }
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' }) // Operation summary
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
    type: UserResponseDto,
  }) // Response description
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Array of validation error messages',
  })
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Ip() ip: string, @Body() signUpDto: CreateUserDto) {
    this.logger.info(`${AuthController.name} Register attempt from IP: ${ip}`);
    try {
      const result = await this.authService.signUp(signUpDto);
      await this.sendEmailVerifyQueue.add(
        'send-email-verify',
        {
          email: result.email,
        },
        {
          attempts: 3,
          priority: 2,
          removeOnComplete: true,
          removeOnFail: true,
          delay: 1000,
        },
      );
      this.logger.info(
        `User ${signUpDto.username} registered in successfully`,
        AuthController.name,
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'User logout' }) // Operation summary
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  async logOut(@Req() req: Request, @Res() res: Response) {
    try {
      this.logger.info(
        `${AuthController.name} User attempt from IP: ${req.ip}`,
      );
      const token = req.cookies['refresh_token'];
      if (!token) {
        this.logger.warn(
          'Logout attempt without refresh token',
          AuthController.name,
        );
        throw new NotFoundException('Refresh token not found');
      }
      const user = await this.authService.logOut(token);
      res.clearCookie('refresh_token');
      this.logger.info(`User ${user._id} logged out`, AuthController.name);
      res.status(200).json({ message: "logout's" });
    } catch (error) {
      throw error;
    }
  }

  @Get('refresh')
  @Throttle({ default: { limit: 12, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refresh_token')
  @ApiOperation({ summary: 'Refresh access token using a refresh token' }) // Operation summary
  @ApiResponse({
    status: 200,
    description: 'Access token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'New access token',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  }) // Response description
  @ApiResponse({
    status: 400,
    description: 'Unauthorized - missing refresh token',
  })
  async refresh(@Req() request: Request, @Res() res: Response) {
    try {
      const cookies = request.cookies;
      if (!cookies.refresh_token) {
        this.logger.warn(
          `User attempt without refresh token from ip ${request.ip}`,
          AuthController.name,
        );
        throw new UnauthorizedException();
      }
      const access_token = await this.authService.refresh(
        cookies.refresh_token,
      );

      res.status(200).json({ access_token });
    } catch (error) {
      throw error;
    }
  }

  @Get('email/:token')
  @ApiOperation({ summary: 'Verify Email using token' })
  @ApiParam({
    name: 'token',
    description: 'Using token for verify your email',
  })
  @ApiResponse({
    status: 200,
    description: 'Your email was verifired',
    schema: {
      type: 'object',
      properties: {
        msg: {
          type: 'string',
          description: 'Message for tell your about result',
          example: 'Your email is verifired',
        },
      },
    },
  }) // Response description
  @ApiResponse({
    status: 403,
    description: 'Unauthorized - token is not valid',
  })
  async verifyEmail(@Param('token') token, @Res() res: Response) {
    try {
      this.logger.info(`${AuthController.name} User attempt verify`);
      const verifyEmailResult = await this.authService.verifyEmail(token);
      this.logger.info(
        `verification email ${verifyEmailResult.email} successfully`,
      );
      res.status(200).json({ msg: 'Your email is verifired' });
    } catch (error) {
      throw error;
    }
  }

  @Get('/forget-password/:email')
  @ApiOperation({ summary: 'Send reset password form using email of user' })
  @ApiParam({
    name: 'email',
    description: 'Email of account that you want to reset password',
  })
  @ApiResponse({
    status: 200,
    description: 'Unauthorized - token is not valid',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Registration error mail not sent',
  })
  @ApiResponse({
    status: 404,
    description: "NotFound - Can't find user account with email that your sent",
  }) // Response description
  async sendEmailForgetPassword(@Param('email') email, @Res() res: Response) {
    this.logger.info(
      `Request to send forget password email to: ${email}`,
      AuthController.name,
    );
    try {
      const emailUser = await this.authService.sendEmailForgetPassword(email);

      await this.sendEmailVerifyQueue.add(
        'send-email-reset-password',
        {
          email: emailUser.email,
        },
        {
          attempts: 3,
          priority: 2,
          removeOnComplete: true,
          removeOnFail: true,
          delay: 1000,
        },
      );
      this.logger.info(
        `Forget password email sent successfully to: ${email}`,
        AuthController.name,
      );
      return res.status(200).json({ msg: 'LOGIN_EMAIL_RESENT' });
    } catch (err) {
      this.logger.warn(
        `Failed to send forget password email: ${err.message}`,
        AuthController.name,
      );
      return res.status(400).json({ msg: 'LOGIN_ERROR_SEND_EMAIL' });
    }
  }

  @Post('/reset-password/:token')
  @ApiOperation({
    summary: 'Reset User Password',
  })
  @ApiParam({
    name: 'token',
    description:
      'token for prove you are email owner it was send in user e-mail after user click forget password and input user email',
  })
  @ApiResponse({
    status: 200,
    description: 'Reset user password successfully',
  })
  @ApiResponse({
    status: 200,
    description: 'Reset user password successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'token is not valid',
  }) // Response description
  async setNewPassword(
    @Param('token') token,
    @Body() resetPasswordDto: ResetPasswordDto,
    @Res() res: Response,
  ) {
    this.logger.info(
      `Attempt to reset password with token: ${token}`,
      AuthController.name,
    );
    try {
      const resetResult = await this.authService.resetPassword(
        token,
        resetPasswordDto.newPassword,
      );
      this.logger.info(
        `Password reset successful for email: ${resetResult.email}`,
        AuthController.name,
      );
      res.status(200).json({ msg: 'Reset your password already' });
    } catch (error) {
      throw error;
    }
  }
}
