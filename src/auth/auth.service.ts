import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';

import { UsersService } from './../users/users.service';

import { CreateUserDto } from './../users/dto/user.dto';
import { UserResponseDto } from './dto/auth.dto';
import { FORM_FORGET_PASS } from './../utils/forgetPassForm';
import { FORM_VERIFY_EMAIL } from './../utils/emailVerification';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AuthService {
  private ttlCacheToken = 15 * 50 * 1000;
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailerService: MailerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async signIn(username: string, pass: string) {
    try {
      const user = await this.usersService.findOne(username);
      if (!user) {
        throw new NotFoundException('Not found your username');
      }
      if (!user.verifired) {
        throw new UnauthorizedException('Please verify your e-mail first');
      }
      const isMath = await bcrypt.compare(pass, user.password);

      if (!isMath) {
        throw new UnauthorizedException('Password is incorrect');
      }

      let payload: any = {};
      payload = {
        sub: user.id,
        username: user.username,
        roles: user.roles,
      };
      const refresh_token = await this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('EXPIRES_IN_REFRESH_TOKEN'),
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const access_token = await this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('EXPIRES_IN_ACCESS_TOKEN'),
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      await user.save();
      const userInfo = {
        id: user.id,
        email: user.email,
        profileUrl: user.profileUrl,
      };

      return {
        access_token: access_token,
        refresh_token: refresh_token,
        userInfo,
      };
    } catch (error) {
      throw error;
    }
  }

  async signUp(Body: CreateUserDto): Promise<UserResponseDto> {
    try {
      const usernameAlreadyExists = await this.usersService.findOne(
        Body.username,
      );
      if (usernameAlreadyExists) {
        throw new UnauthorizedException('username has been used');
      }
      const emailAlreadyExists = await this.usersService.findByEmail(
        Body.email,
      );
      if (emailAlreadyExists) {
        throw new UnauthorizedException('email has been used');
      }
      const hashPassword = await bcrypt.hash(Body.password, 10);
      return this.usersService.createUser({
        ...Body,
        password: hashPassword,
      });
    } catch (error) {
      throw error;
    }
  }

  async refresh(refreshToken: string) {
    try {
      const verifyToken = await this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const payload = {
        sub: verifyToken.sub,
        username: verifyToken.username,
        roles: verifyToken.roles,
      };

      const access_token = await this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('EXPIRES_IN_ACCESS_TOKEN'),
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      return access_token;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new ForbiddenException('token expired');
      }
      throw error;
    }
  }

  public async sendEmailVerification(email: string) {
    const uniqueString = await this.jwtService.signAsync(
      { email },
      {
        expiresIn: this.configService.get<string>('EXPIRES_IN_EMAIL_TOKEN'),
        secret: this.configService.get<string>('SECRET_VERIFY_EMAIL'),
      },
    );

    try {
      const clientUrl = this.configService.getOrThrow<string>('CLIENT_URL');
      await this.mailerService.sendMail({
        from: this.configService.get<string>('EMAIL_AUTH'),
        to: email,
        subject: 'Verify Your Email',
        html: FORM_VERIFY_EMAIL(uniqueString, clientUrl),
      });
      await this.cacheManager.set(
        uniqueString,
        JSON.stringify({ token: uniqueString, isVerify: false }),
        this.ttlCacheToken,
      );
      return true;
    } catch (err) {
      throw err;
    }
  }

  async verifyEmail(uniqueString: string) {
    try {
      const tokenData = await this.getTokenDataFromCache(uniqueString);
      this.validateTokenDataVerifyEmail(tokenData);

      const { email } = await this.jwtService.verify(uniqueString, {
        secret: this.configService.get<string>('SECRET_VERIFY_EMAIL'),
      });
      await this.cacheManager.del(uniqueString);
      // create new cache object
      await this.cacheManager.set(
        uniqueString,
        JSON.stringify({ tokenData, isVerify: true }),
        this.ttlCacheToken,
      );

      return await this.usersService.verifiedUserEmail(email);
    } catch (err) {
      throw err;
    }
  }

  async sendEmailForgetPassword(email: string) {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new HttpException('LOGIN_USER_NOT_FOUND', HttpStatus.NOT_FOUND);
      }
      return user;
    } catch (err) {
      throw err;
    }
  }

  public async sendMailResetPassword(email: string) {
    const clientUrl = this.configService.getOrThrow<string>('CLIENT_URL');
    const resetPassToken = await this.jwtService.signAsync(
      { email },
      {
        expiresIn: this.configService.get<string>(
          'EXPIRES_IN_RESET_PASS_TOKEN',
        ),
        secret: this.configService.get<string>('SECRET_RESET_PASS'),
      },
    );

    await this.cacheManager.set(
      resetPassToken,
      JSON.stringify({ token: resetPassToken, isVerify: false }),
      this.ttlCacheToken,
    );

    const mail = await this.mailerService.sendMail({
      from: this.configService.get<string>('EMAIL_AUTH'),
      to: email,
      subject: 'Reset your password',
      html: FORM_FORGET_PASS(resetPassToken, clientUrl),
    });
    return mail;
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const tokenData = await this.getTokenDataFromCache(token);

      this.validateTokenDataResetPassword(tokenData);

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('SECRET_RESET_PASS'),
      });

      const hashPassword = await bcrypt.hash(newPassword, 10);
      // delete data old
      await this.cacheManager.del(token);
      // create new cache object
      await this.cacheManager.set(
        token,
        JSON.stringify({ token, isVerify: true }),
        this.ttlCacheToken,
      );

      return await this.usersService.setNewPassword(
        payload.email,
        hashPassword,
      );
    } catch (error) {
      throw error;
    }
  }
  async getTokenDataFromCache(token: string): Promise<string | null> {
    return await this.cacheManager.get(token);
  }

  async checkIsActive(username: string): Promise<boolean> {
    const user = await this.usersService.findOne(username);

    if (!user) {
      throw new NotFoundException('not found user');
    }
    return user.isActive;
  }

   validateTokenDataResetPassword(tokenData: string | null) {
    if (!tokenData) {
      throw new HttpException('Token is not valid', HttpStatus.FORBIDDEN);
    }

    const tokenCache = JSON.parse(tokenData as string);

    if (tokenCache.isVerify) {
      throw new HttpException('Reset password already', HttpStatus.FORBIDDEN);
    }
  }
   validateTokenDataVerifyEmail(tokenData: string | null) {
    if (!tokenData) {
      throw new HttpException('Token is not valid', HttpStatus.FORBIDDEN);
    }

    const tokenCache = JSON.parse(tokenData as string);

    if (tokenCache.isVerify) {
      throw new HttpException(
        'Email verified successfully',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
