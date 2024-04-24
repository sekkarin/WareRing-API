import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { dashboardProviders } from './provider/provider';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, ...dashboardProviders],
  imports: [DatabaseModule],
})
export class DashboardModule {}
