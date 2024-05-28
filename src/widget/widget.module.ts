import { Module } from '@nestjs/common';
import { WidgetService } from './widget.service';
import { WidgetController } from './widget.controller';
import { DatabaseModule } from './../database/database.module';
import { widgetProviders } from './provider/provider';
import { userProviders } from 'src/users/provider/user.providers';

@Module({
  controllers: [WidgetController],
  providers: [WidgetService, ...widgetProviders, ...userProviders],
  imports: [DatabaseModule],
})
export class WidgetModule {}
