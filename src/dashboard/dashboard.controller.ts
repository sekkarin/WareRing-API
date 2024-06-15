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
  Put,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { IsActivateUser } from 'src/users/guard/active.guard';
import { AuthGuard } from 'src/auth/guards/auth.guard';

import { DashboardService } from './dashboard.service';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { MongoDBObjectIdPipe } from 'src/utils/pipes/mongodb-objectid.pipe';
import { PaginationQueryparamsDto } from 'src/device/dto/pagination-query-params.dto';
import { DashboardPositionDto } from './dto/position-dashboarrd.dto';
import { CustomLoggerInterceptor } from 'src/utils/interceptors/customLoggerInterceptor';
import { WinstonLoggerService } from 'src/logger/logger.service';

@ApiBearerAuth()
@ApiTags('Dashboards')
@Controller('dashboards')
@Roles(Role.User)
@UseGuards(AuthGuard, RolesGuard, IsActivateUser)
@UseInterceptors(CustomLoggerInterceptor)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly logger: WinstonLoggerService,
  ) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Dashboard created successfully',
    type: CreateDashboardDto, // Specify the response DTO
  })
  @ApiOperation({ summary: 'Create a new dashboard' })
  create(@Req() req: Request, @Body() createDashboardDto: CreateDashboardDto) {
    this.logger.info(
      `User ${req['user'].sub} create Dashboard ${createDashboardDto.nameDashboard}`,
      DashboardController.name,
    );
    try {
      const { sub } = req['user'];
      return this.dashboardService.create(createDashboardDto, sub);
    } catch (error) {
      throw error;
    }
  }

  @Post('/:dashboardId/widget/:widgetId')
  @ApiOperation({ summary: 'Add a new widget' })
  addWidget(
    @Req() req: Request,
    @Param('widgetId', MongoDBObjectIdPipe) widgetId: string,
    @Param('dashboardId', MongoDBObjectIdPipe) dashboardId: string,
  ) {
    this.logger.info(
      `User ${req['user'].sub} add widget id ${widgetId} to  Dashboard id ${dashboardId}`,
      DashboardController.name,
    );
    try {
      return this.dashboardService.addWidget(dashboardId, widgetId);
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @ApiQuery({
    name: 'query',
    type: String,
    required: false,
    description: 'Page number for pagination (default: 1)',
  })
  @ApiQuery({
    name: 'createdAt',
    enum: ['+createdAt', '-createdAt'],
    required: false,
    description: 'limit Number of items  (default: 10)',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Page number for pagination (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'limit Number of items  (default: 10)',
  })
  @ApiOperation({ summary: 'Get dashboards' })
  findAll(
    @Req() req: Request,
    @Query() paginationQueryparamsDto: PaginationQueryparamsDto,
  ) {
    this.logger.log(
      `User ${req['user'].sub} get Dashboards`,
      DashboardController.name,
    );
    const { sub } = req['user'];
    try {
      const { page, limit, query, createdAt } = paginationQueryparamsDto;
      return this.dashboardService.findAll(query, page, limit, createdAt, sub);
    } catch (error) {
      throw error;
    }
  }

  @Get(':dashboardId')
  @ApiOperation({ summary: 'Get a dashboard by Id' })
  findOne(
    @Req() req: Request,
    @Param('dashboardId', MongoDBObjectIdPipe) dashboardId: string,
  ) {
    this.logger.log(
      `User ${req['user'].sub} get Dashboard id ${dashboardId}`,
      DashboardController.name,
    );
    const { sub } = req['user'];
    try {
      return this.dashboardService.findOne(sub, dashboardId);
    } catch (error) {
      throw error;
    }
  }

  @Patch(':dashboardId')
  @ApiOperation({ summary: 'Update a dashboard by Id' })
  update(
    @Param('dashboardId', MongoDBObjectIdPipe) dashboardId: string,
    @Body() updateDashboardDto: UpdateDashboardDto,
    @Req() req: Request,
  ) {
    this.logger.info(
      `User ${req['user'].sub} update Dashboard id ${dashboardId}`,
      DashboardController.name,
    );
    try {
      return this.dashboardService.update(dashboardId, updateDashboardDto);
    } catch (error) {
      throw error;
    }
  }
  @Put(':dashboardId/position')
  @ApiOperation({ summary: 'Update a dashboard by Id' })
  updatePosition(
    @Param('dashboardId', MongoDBObjectIdPipe) dashboardId: string,
    @Body() dashboardPositionDto: DashboardPositionDto,
    @Req() req: Request,
  ) {
    this.logger.info(
      `User ${req['user'].sub} update position widget, Dashboard id ${dashboardId}`,
      DashboardController.name,
    );
    try {
      return this.dashboardService.updatePosition(
        dashboardId,
        dashboardPositionDto,
      );
    } catch (error) {
      throw error;
    }
  }

  @Delete(':dashboardId')
  @ApiOperation({ summary: 'Delete a dashboard by Id' })
  deleteDashboard(
    @Param('dashboardId', MongoDBObjectIdPipe) dashboardId: string,
    @Req() req: Request,
  ) {
    this.logger.info(
      `User ${req['user'].sub} delete Dashboard id ${dashboardId}`,
      DashboardController.name,
    );
    try {
      return this.dashboardService.remove(dashboardId);
    } catch (error) {
      throw error;
    }
  }

  @Delete('/:dashboardId/widget/:widgetId')
  @ApiOperation({ summary: 'Delete a widget in dashboard' })
  deleteWidget(
    @Req() req: Request,
    @Param('widgetId', MongoDBObjectIdPipe) widgetId: string,
    @Param('dashboardId', MongoDBObjectIdPipe) dashboardId: string,
  ) {
    this.logger.info(
      `User ${req['user'].sub} delete widget in Dashboard id ${dashboardId}`,
      DashboardController.name,
    );
    try {
      const { sub } = req['user'];
      return this.dashboardService.deleteWidget(dashboardId, widgetId, sub);
    } catch (error) {
      throw error;
    }
  }
}
