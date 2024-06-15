import {
  Controller,
  Get,
  Param,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ExportService } from './export.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { IsActivateUser } from 'src/users/guard/active.guard';

import { MongoDBObjectIdPipe } from 'src/utils/pipes/mongodb-objectid.pipe';

import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CustomLoggerInterceptor } from 'src/utils/interceptors/customLoggerInterceptor';
import { WinstonLoggerService } from 'src/logger/logger.service';

@Controller('export')
@ApiTags('Exports Data')
@ApiBearerAuth()
@Roles(Role.User)
@UseGuards(AuthGuard, RolesGuard, IsActivateUser)
@UseInterceptors(CustomLoggerInterceptor)
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly logger: WinstonLoggerService,
  ) {}

  @Get('/:deviceId')
  async exportDataAsJson(
    @Req() req: Request,
    @Res() res: Response,
    @Param('deviceId', MongoDBObjectIdPipe) deviceId: string,
  ) {
    this.logger.info(
      `User ${req['user'].sub} export data device id ${deviceId}`,
      ExportController.name,
    );
    try {
      const { sub } = req['user'];
      const data = await this.exportService.exportData(deviceId, sub);
      res.send(JSON.stringify(data));
    } catch (error) {
      throw error;
    }
  }
}
