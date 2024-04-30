import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { dashboardProviders } from './provider/provider';
import { DatabaseModule } from 'src/database/database.module';
import { widgetProviders } from 'src/widget/provider/provider';
import { userProviders } from 'src/users/provider/user.providers';

@Module({
  controllers: [DashboardController],
  providers: [
    DashboardService,
    ...dashboardProviders,
    ...widgetProviders,
    ...userProviders,
  ],
  imports: [DatabaseModule],
})
export class DashboardModule {}
