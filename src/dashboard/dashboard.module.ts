import { Module } from '@nestjs/common';

import { dashboardProviders } from './provider/provider';
import { widgetProviders } from 'src/widget/provider/provider';
import { userProviders } from 'src/users/provider/user.providers';

import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { DatabaseModule } from 'src/database/database.module';

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
