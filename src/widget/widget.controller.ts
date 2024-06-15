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
  NotFoundException,
  UseInterceptors,
} from '@nestjs/common';
import { WidgetService } from './widget.service';
import { CreateWidgetDto } from './dto/create-widget.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { WidgetResponseDto } from './dto/response-widget.dto';
import { Roles } from './../auth/decorator/roles.decorator';
import { Role } from './../auth/enums/role.enum';
import { AuthGuard } from './../auth/guards/auth.guard';
import { RolesGuard } from './../auth/guards/roles.guard';
import { MongoDBObjectIdPipe } from './../utils/pipes/mongodb-objectid.pipe';
import { IsActivateUser } from 'src/users/guard/active.guard';
import { CustomLoggerInterceptor } from 'src/utils/interceptors/customLoggerInterceptor';
import { WinstonLoggerService } from 'src/logger/logger.service';

@ApiTags('Widget')
@Controller('widgets')
@Roles(Role.User)
@Throttle({ default: { limit: 30, ttl: 60000 } })
@UseGuards(AuthGuard, RolesGuard, IsActivateUser)
@UseInterceptors(CustomLoggerInterceptor)
export class WidgetController {
  constructor(
    private readonly widgetService: WidgetService,
    private readonly logger: WinstonLoggerService,
  ) {}

  @Post(':deviceId')
  @ApiOperation({ summary: 'Create a new widget' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    description: 'The widget has been successfully created',
    type: WidgetResponseDto,
  })
  async create(
    @Body() createWidgetDto: CreateWidgetDto,
    @Req() req: Request,
    @Param('deviceId', MongoDBObjectIdPipe) deviceId: string,
  ): Promise<WidgetResponseDto> {
    try {
      this.logger.info(
        `User ${req['user'].username} create widget ${createWidgetDto.label}`,
        WidgetController.name,
      );
      return this.widgetService.create(createWidgetDto, deviceId);
    } catch (error) {
      throw error;
    }
  }

  @Get(':deviceId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all widgets for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of widgets',
    type: [WidgetResponseDto],
  })
  findAll(
    @Param('deviceId', MongoDBObjectIdPipe) deviceId: string,
    @Req() req: Request,
  ): Promise<WidgetResponseDto[]> {
    try {
      this.logger.log(
        `User ${req['user'].username} get widgets from device id ${deviceId}`,
        WidgetController.name,
      );
      return this.widgetService.findAll(deviceId);
    } catch (error) {
      throw error;
    }
  }

  @Get(':widgetId/widget')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single widget by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the widget',
    type: WidgetResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Widget not found' })
  async findOne(
    @Param('widgetId', MongoDBObjectIdPipe) widgetId: string,
    @Req() req: Request,
  ): Promise<WidgetResponseDto> {
    try {
      this.logger.log(
        `${WidgetController.name} User ${req['user'].username} get widget id ${widgetId}`,
      );
      return this.widgetService.findOne(widgetId);
    } catch (error) {
      throw error;
    }
  }

  @Patch(':widgetId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a widget' })
  @ApiResponse({
    status: 200,
    description: 'Widget updated successfully',
    type: WidgetResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Widget not found' })
  update(
    @Param('widgetId', MongoDBObjectIdPipe) widgetId: string,
    @Body() updateWidgetDto: UpdateWidgetDto,
    @Req() req: Request,
  ) {
    this.logger.info(
      `User ${req['user'].username} update widget id ${widgetId}`,
      WidgetController.name,
    );
    try {
      return this.widgetService.update(widgetId, updateWidgetDto);
    } catch (error) {
      throw error;
    }
  }

  @Delete('/:widgetId/device/:deviceId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a widget' })
  @ApiResponse({ status: 200, description: 'Widget deleted successfully' })
  @ApiResponse({ status: 404, description: 'Widget not found' })
  async delete(
    @Param('widgetId', MongoDBObjectIdPipe) widgetId: string,
    @Param('deviceId', MongoDBObjectIdPipe) deviceId: string,
    @Req() req: Request,
  ) {
    this.logger.info(
      `User ${req['user'].username} delete widget id ${widgetId} device id ${deviceId}`,
      WidgetController.name,
    );
    try {
      await this.widgetService.delete(widgetId, deviceId);
      return { message: 'Widget deleted successfully' };
    } catch (error) {
      throw error;
    }
  }
}
