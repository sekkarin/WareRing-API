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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create a new dashboard' })
  create(@Req() req: Request, @Body() createDashboardDto: CreateDashboardDto) {
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
    const { sub } = req['user'];
    try {
      const { page, limit, query } = paginationQueryparamsDto;
      return this.dashboardService.findAll(query, page, limit, sub);
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
    const { sub } = req['user'];
    try {
      return this.dashboardService.findOne(sub, dashboardId);
    } catch (error) {
      throw error;
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a dashboard by Id' })
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
  @ApiOperation({ summary: 'Delete a dashboard by Id' })
  deleteDashboard(@Param('id', MongoDBObjectIdPipe) id: string) {
    try {
      return this.dashboardService.remove(id);
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
    try {
      const { sub } = req['user'];
      return this.dashboardService.deleteWidget(dashboardId, widgetId, sub);
    } catch (error) {
      throw error;
    }
  }
}
