import { Connection } from 'mongoose';
import { DataSchema } from '../schemas/data.schema';

export const dataProviders = [
  {
    provide: 'DATA_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('DATA', DataSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
