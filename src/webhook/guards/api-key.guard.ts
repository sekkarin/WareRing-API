import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { APIKey } from 'src/api-key/interface/api-key.interface';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @Inject('API-KEY_MODEL') private readonly apiKeyModel: Model<APIKey>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const SECRET_API_KEY =
      this.configService.getOrThrow<string>('SECRET_API_KEY');
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('api key not provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(apiKey, {
        secret: SECRET_API_KEY,
      });
      const apiKeyExiting = await this.apiKeyModel.findOne({
        key: payload.key,
      });
      if (!apiKeyExiting) {
        throw new ForbiddenException('The API key is not available');
      }
      if (!apiKeyExiting.active) {
        throw new ForbiddenException('The API key is not active');
      }
    } catch (error) {
      throw error;
    }
    return true;
  }
}
