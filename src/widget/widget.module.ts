import { Module } from '@nestjs/common';
import { WidgetService } from './widget.service';
import { WidgetController } from './widget.controller';
import { DatabaseModule } from './../database/database.module';
import { widgetProviders } from './provider/provider';

@Module({
  controllers: [WidgetController],
  providers: [WidgetService, ...widgetProviders],
  imports: [DatabaseModule],
})
export class WidgetModule {}
