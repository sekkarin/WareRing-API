import { Connection } from 'mongoose';
import { ApiKeySchema } from '../schema/api-key.schema';

export const apiKeyProviders = [
  {
    provide: 'API-KEY_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('ApiKey', ApiKeySchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
