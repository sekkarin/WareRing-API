import * as mongoose from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { MongoMemoryServer } from 'mongodb-memory-server';

const configService = new ConfigService();

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: async (): Promise<typeof mongoose> => {
      if (process.env.NODE_ENV === 'test') {
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        return mongoose.connect(uri, {
          dbName: 'warering-project',
        });
      } else {
        return mongoose.connect(
          configService.get<string>('DATABASE_URL') || process.env.DATABASE_URL,
          {
            dbName: 'warering-project',
          },
        );
      }
    },
  },
];