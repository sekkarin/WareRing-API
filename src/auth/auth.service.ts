import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/interfaces/user.interface';
import * as bcrypt from 'bcrypt';
import { TokenExpiredError } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from 'src/users/dto/user.dto';
import { UserResponseDto } from './dto/auth.dto';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}
  async signIn(username: string, pass: string) {
    try {
      const user = await this.usersService.findOne(username);

      const isMath = await bcrypt.compare(pass, user.password);
      if (!isMath) {
        throw new UnauthorizedException();
      }

      let payload: any = {};
      let roles: any = [];
      if (user.role.Admin) {
        roles = [user.role.Admin, user.role.User];
      } else {
        roles = [user.role.User];
      }
      payload = {
        sub: user.id,
        username: user.username,
        roles,
      };
      const refresh_token = await this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('EXPIRES_IN_REFRESH_TOKEN'),
        secret: this.configService.get<string>('SECRET_TOKEN'),
      });
      const access_token = await this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('EXPIRES_IN_ACCESS_TOKEN'),
        secret: this.configService.get<string>('SECRET_TOKEN'),
      });
      user.refreshToken = refresh_token;
      await user.save();

      return {
        access_token: access_token,
        refresh_token: refresh_token,
      };
    } catch (error) {
      throw new HttpException(
        'Unauthorized - incorrect or missing credentials',
        HttpStatus.FORBIDDEN,
      );
    }
  }
  async signUp(Body: CreateUserDto): Promise<UserResponseDto> {
    const hashPassword = await bcrypt.hash(Body.password, 10);
    return this.usersService.createUser({
      ...Body,
      password: hashPassword,
      isAlive: true,
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
      console.log(error);

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
          secret: this.configService.get<string>('SECRET_TOKEN'),
        });
        if (verifyToken.username != foundUser.username) {
          throw new ForbiddenException();
        }
        let roles: any = [];
        if (foundUser.role.Admin) {
          roles = [foundUser.role.Admin, foundUser.role.User];
        } else {
          roles = [foundUser.role.User];
        }
        const payload = {
          sub: foundUser.id,
          username: foundUser.username,
          roles: roles,
        };

        const access_token = await this.jwtService.signAsync(payload, {
          expiresIn: this.configService.get<string>('EXPIRES_IN_ACCESS_TOKEN'),
          secret: this.configService.get<string>('SECRET_TOKEN'),
        });
        return access_token;
      } catch (error) {
        console.log(error);

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
}
