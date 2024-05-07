import { Module } from '@nestjs/common';

import { ExportService } from './export.service';
import { ExportController } from './export.controller';

import { dataProviders } from 'src/webhook/provider/provider';
import { DatabaseModule } from 'src/database/database.module';
import { deviceProviders } from 'src/device/provider/provider';
import { userProviders } from 'src/users/provider/user.providers';

@Module({
  controllers: [ExportController],
  providers: [
    ExportService,
    ...dataProviders,
    ...deviceProviders,
    ...userProviders,
  ],
  imports: [DatabaseModule],
})
export class ExportModule {}
