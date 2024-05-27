import { Connection } from 'mongoose';
import { WidgetSchema } from '../schamas/widget.schema';

export const widgetProviders = [
  {
    provide: 'WIDGET_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('Widget', WidgetSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
