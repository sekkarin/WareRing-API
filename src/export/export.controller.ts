import { Controller, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
import { ExportService } from './export.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { IsActivateUser } from 'src/users/guard/active.guard';

import { MongoDBObjectIdPipe } from 'src/utils/pipes/mongodb-objectid.pipe';

import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';


@Controller('export')
@ApiTags('Exports Data')
@ApiBearerAuth()
@Roles(Role.User)
@UseGuards(AuthGuard, RolesGuard, IsActivateUser)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('/:deviceId')
  async exportDataAsJson(
    @Req() req: Request,
    @Res() res: Response,
    @Param('deviceId', MongoDBObjectIdPipe) deviceId: string,
  ) {
    try {
      const { sub } = req['user'];
      const data = await this.exportService.exportData(deviceId, sub);
      res.send(JSON.stringify(data));
    } catch (error) {
      throw error;
    }
  }
}
