import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { AuthService } from './auth.service';
import { Roles } from './decorator/roles.decorator';
import { Role } from './enums/role.enum';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { CreateUserDto } from './../users/dto/user.dto';
import {
  AccessTokenResponseDto,
  BodyUserLoginDto,
  ResetPasswordDto,
  UserResponseDto,
} from './dto/auth.dto';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(
    private readonly authService: AuthService, // private myLogger: MyLoggerService// private jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectQueue('sendEmailVerify') private sendEmailVerifyQueue: Queue,
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
  async signIn(@Body() signInDto: BodyUserLoginDto, @Res() res: Response) {
    const checkIsActive = await this.authService.checkIsActive(
      signInDto.username,
    );
    if (!checkIsActive) {
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
    return res.status(200).json({ access_token: user.access_token });
  }

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
  @Post('register')
  async signUp(@Body() signUpDto: CreateUserDto) {
    try {
      // console.log(signUpDto);

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
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' }) // Operation summary
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  @Roles(Role.User, Role.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  async logOut(@Req() req: Request, @Res() res: Response) {
    const username = req.user.username;
    await this.authService.logOut(username);
    res.clearCookie('refresh_token');
    res.status(200).json({ message: "logout's" });
  }

  @Get('refresh')
  @HttpCode(HttpStatus.OK)
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
  @ApiCookieAuth('refresh_token')
  @ApiBearerAuth()
  async refresh(@Req() request: Request, @Res() res: Response) {
    const cookies = request.cookies;
    if (!cookies.refresh_token) {
      throw new UnauthorizedException();
    }
    const access_token = await this.authService.refresh(cookies.refresh_token);
    res.status(200).json({ access_token });
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
    await this.authService.verifyEmail(token);
    res.status(200).json({ msg: 'Your email is verifired' });
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
    try {
      const isEmailSent = await this.authService.sendEmailForgetPassword(email);
      if (isEmailSent) {
        return res.status(200).json({ msg: 'LOGIN_EMAIL_RESENT' });
      } else {
        return res
          .status(401)
          .json({ msg: 'REGISTRATION_ERROR_MAIL_NOT_SENT' });
      }
    } catch (err) {
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
    await this.authService.resetPassword(token, resetPasswordDto.newPassword);
    res.status(200).json({ msg: 'Reset your password already' });
  }
}
