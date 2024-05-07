import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';

import { LoggerService } from 'src/logger/logger.service';
import { UsersService } from './../users/users.service';

import { CreateUserDto } from './../users/dto/user.dto';
import { UserResponseDto } from './dto/auth.dto';
import { FORM_FORGET_PASS } from './../utils/forgetPassForm';
import { FORM_VERIFY_EMAIL } from './../utils/emailVerification';

@Injectable()
export class AuthService {
  private readonly logger = new LoggerService(AuthService.name);
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailerService: MailerService,
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
      user.refreshToken = refresh_token;
      await user.save();

      return {
        access_token: access_token,
        refresh_token: refresh_token,
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

  async logOut(username: string) {
    try {
      const fondUser = await this.usersService.findOne(username);
      if (!fondUser) {
        throw new NotFoundException('user not found');
      }
      fondUser.refreshToken = '';
      await fondUser.save();
      return;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new ForbiddenException('Token expired');
      }
      throw error;
    }
  }

  async refresh(refreshToken: string) {
    try {
      const foundUser = await this.usersService.findOneToken(refreshToken);
      if (!foundUser) {
        throw new NotFoundException('user not found');
      }
      const verifyToken = await this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      if (verifyToken.username != foundUser.username) {
        throw new ForbiddenException('invalid token');
      }
      const payload = {
        sub: foundUser.id,
        username: foundUser.username,
        roles: foundUser.roles,
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
      const clientUrl = this.configService.get<string>('CLIENT_URL');
      await this.mailerService.sendMail({
        from: this.configService.get<string>('EMAIL_AUTH'),
        to: email,
        subject: 'Verify Your Email',
        html: FORM_VERIFY_EMAIL(uniqueString, clientUrl),
      });
      return true;
    } catch (err) {
      throw err;
    }
  }

  async verifyEmail(uniqueString: string) {
    try {
      const { email } = await this.jwtService.verify(uniqueString, {
        secret: this.configService.get<string>('SECRET_VERIFY_EMAIL'),
      });

      return await this.usersService.verifiredUserEmail(email);
    } catch (err) {
      throw new HttpException(
        'Unauthorized - token is not valid',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async sendEmailForgetPassword(email: string): Promise<boolean> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new HttpException('LOGIN_USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    try {
      const resetPassToken = await this.jwtService.signAsync(
        { email },
        {
          expiresIn: this.configService.get<string>(
            'EXPIRES_IN_RESET_PASS_TOKEN',
          ),
          secret: this.configService.get<string>('SECRET_RESET_PASS'),
        },
      );
      const mail = await this.mailerService.sendMail({
        from: this.configService.get<string>('EMAIL_AUTH'),
        to: email,
        subject: 'Reset your password',
        html: FORM_FORGET_PASS(resetPassToken),
      });
      return mail;
    } catch (err) {
      throw err;
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('SECRET_RESET_PASS'),
      });
      const hashPassword = await bcrypt.hash(newPassword, 10);
      return await this.usersService.setNewPassword(
        payload.email,
        hashPassword,
      );
    } catch (error) {
      throw new HttpException(
        'Unauthorized - token is not valid',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async checkIsActive(username: string): Promise<boolean> {
    const user = await this.usersService.findOne(username);
    if (!user) {
      throw new NotFoundException('not found user');
    }
    return user.isActive;
  }
}
