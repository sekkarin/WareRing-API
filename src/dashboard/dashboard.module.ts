import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { dashboardProviders } from './provider/provider';
import { DatabaseModule } from 'src/database/database.module';
import { widgetProviders } from 'src/widget/provider/provider';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, ...dashboardProviders, ...widgetProviders],
  imports: [DatabaseModule],
})
export class DashboardModule {}
