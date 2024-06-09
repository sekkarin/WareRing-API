import { Connection } from 'mongoose';
import { dashboardSchema } from '../schemas/dashboard.schema';

export const dashboardProviders = [
  {
    provide: 'DASHBOARD_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('Dashboard', dashboardSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
