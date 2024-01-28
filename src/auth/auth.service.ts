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
        console.log(error);
        
        throw new ForbiddenException();
      }
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
}
