import * as mongoose from 'mongoose';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: (): Promise<typeof mongoose> =>
      mongoose.connect(configService.get<string>('DATABASE_URL')||process.env.DATABASE_URL),
      
  },
];
