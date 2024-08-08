import * as mongoose from 'mongoose';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: async (): Promise<typeof mongoose> => {
      return mongoose.connect(
        configService.get<string>('DATABASE_URL') || process.env.DATABASE_URL,
        {
          dbName: 'warering-project',
          maxPoolSize: 500,
          minPoolSize: 150,
        },
      );
    },
  },
];
