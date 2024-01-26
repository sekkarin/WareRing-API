import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      console.log('UnauthorizedException', token);

      throw new UnauthorizedException();
    }

    
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('SECRET_TOKEN'),
      });
    

      request['user'] = payload;
    } catch (error) {

      throw new ForbiddenException();
    }
    return true;
  }

  /**
   * The function extracts a token from the authorization header of a request if it is of type "Bearer".
   * @param {Request} request - The `request` parameter is of type `Request`, which represents an HTTP
   * request. It likely contains information such as headers, body, and query parameters.
   * @returns a string if the type of authorization is 'Bearer', otherwise it returns undefined.
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
