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

import { UsersService } from './../users/users.service';
import { User } from './../users/interfaces/user.interface';
import { CreateUserDto } from './../users/dto/user.dto';
import { UserResponseDto } from './dto/auth.dto';
import { FORM_FORGET_PASS } from './../utils/forgetPassForm';
import { FORM_VERIFY_EMAIL } from './../utils/emailVerification';

@Injectable()
export class AuthService {
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
    const usernameAlreadyExists = await this.usersService.findOne(
      Body.username,
    );
    if (usernameAlreadyExists) {
      throw new UnauthorizedException('username has been used');
    }
    const emailAlreadyExists = await this.usersService.findByEmail(Body.email);
    if (emailAlreadyExists) {
      throw new UnauthorizedException('email has been used');
    }
    await this.sendEmailVerification(Body.email);
    const hashPassword = await bcrypt.hash(Body.password, 10);
    return this.usersService.createUser({
      ...Body,
      password: hashPassword,
    });
  }

  async logOut(username: string): Promise<User | undefined> {
    try {
      const fondUser = await this.usersService.findOne(username);
      if (!fondUser) {
        throw new HttpException('FORBIDDEN', HttpStatus.FORBIDDEN);
      }
      fondUser.refreshToken = '';
      return await fondUser.save();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }
      throw new HttpException(
        'INTERNAL_SERVER_ERROR',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async refresh(refreshToken: string) {
    try {
      const foundUser = await this.usersService.findOneToken(refreshToken);
      if (!foundUser) {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }

      try {
        const verifyToken = this.jwtService.verify(refreshToken, {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        });
        if (verifyToken.username != foundUser.username) {
          throw new ForbiddenException();
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
        throw new ForbiddenException();
      }
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }
      throw new HttpException(
        'INTERNAL_SERVER_ERROR',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      await this.mailerService.sendMail({
        from: this.configService.get<string>('EMAIL_AUTH'),
        to: email,
        subject: 'Verify Your Email',
        html: FORM_VERIFY_EMAIL(uniqueString),
      });
      return true;
    } catch (err) {
      console.log(err);
      
      throw new HttpException(
        'INTERNAL_SERVER_ERROR',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async verifyEmail(uniqueString: string) {
    try {
      const { email } = await this.jwtService.verify(uniqueString, {
        secret: this.configService.get<string>('SECRET_VERIFY_EMAIL'),
      });
      this.usersService.verifiredUserEmail(email);
      return;
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
