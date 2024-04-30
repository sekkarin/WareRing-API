import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { MongoDBObjectIdPipe } from 'src/utils/pipes/mongodb-objectid.pipe';
import { PaginationQueryparamsDto } from 'src/device/dto/pagination-query-params.dto';

@ApiBearerAuth()
@ApiTags('Dashboards')
@Controller('dashboards')
@Roles(Role.User)
@UseGuards(AuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Dashboard created successfully',
    type: CreateDashboardDto, // Specify the response DTO
  })
  create(@Req() req: Request, @Body() createDashboardDto: CreateDashboardDto) {
    try {
      const { sub } = req['user'];
      return this.dashboardService.create(createDashboardDto, sub);
    } catch (error) {
      throw error;
    }
  }

  @Post('/:dashboardId/widget/:widgetId')
  addWidget(
    @Req() req: Request,
    @Param('widgetId', MongoDBObjectIdPipe) widgetId: string,
    @Param('dashboardId', MongoDBObjectIdPipe) dashboardId: string,
  ) {
    try {
      return this.dashboardService.addWidget(dashboardId, widgetId);
    } catch (error) {
      throw error;
    }
  }

  @Get()
  findAll(
    @Req() req: Request,
    @Query('query') query: string,
    @Query() paginationQueryparamsDto: PaginationQueryparamsDto,
  ) {
    const { sub } = req['user'];
    try {
      const { page, limit } = paginationQueryparamsDto;
      return this.dashboardService.findAll(query, page, limit, sub);
    } catch (error) {
      throw error;
    }
  }

  @Get(':dashboardId')
  findOne(
    @Req() req: Request,
    @Param('dashboardId', MongoDBObjectIdPipe) dashboardId: string,
  ) {
    const { sub } = req['user'];
    try {
      return this.dashboardService.findOne(sub, dashboardId);
    } catch (error) {
      throw error;
    }
  }

  @Patch(':id')
  update(
    @Param('id', MongoDBObjectIdPipe) id: string,
    @Body() updateDashboardDto: UpdateDashboardDto,
  ) {
    try {
      return this.dashboardService.update(id, updateDashboardDto);
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  deleteDashboard(@Param('id', MongoDBObjectIdPipe) id: string) {
    try {
      return this.dashboardService.remove(id);
    } catch (error) {
      throw error;
    }
  }

  @Delete('/:dashboardId/widget/:widgetId')
  deleteWidget(
    @Req() req: Request,
    @Param('widgetId', MongoDBObjectIdPipe) widgetId: string,
    @Param('dashboardId', MongoDBObjectIdPipe) dashboardId: string,
  ) {
    try {
      const { sub } = req['user'];
      return this.dashboardService.deleteWidget(dashboardId, widgetId, sub);
    } catch (error) {
      throw error;
    }
  }
}
