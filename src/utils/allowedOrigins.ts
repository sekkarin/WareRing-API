import { ConfigService } from '@nestjs/config';
const configService = new ConfigService();

export const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS').split(',');
