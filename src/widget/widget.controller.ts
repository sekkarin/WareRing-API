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
  NotFoundException,
} from '@nestjs/common';
import { WidgetService } from './widget.service';
import { CreateWidgetDto } from './dto/create-widget.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Widget } from './interface/widget.interface';
import { WidgetResponseDto } from './dto/response-widget.dto';
import { Roles } from './../auth/decorator/roles.decorator';
import { Role } from './../auth/enums/role.enum';
import { AuthGuard } from './../auth/guards/auth.guard';
import { RolesGuard } from './../auth/guards/roles.guard';
import { PaginationQueryparamsDto } from './../device/dto/pagination-query-params.dto';
import { PaginatedDto } from './../utils/dto/paginated.dto';
import { WidgetResponsesDto } from './dto/responses-widget.dto';
import { MongoDBObjectIdPipe } from './../utils/pipes/mongodb-objectid.pipe';

@ApiTags('Widget')
@Controller('widgets')
@Roles(Role.User)
@UseGuards(AuthGuard, RolesGuard)
export class WidgetController {
  constructor(private readonly widgetService: WidgetService) {}

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
    return this.widgetService.create(createWidgetDto, deviceId);
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
  ): Promise<WidgetResponseDto[]> {
    return this.widgetService.findAll(deviceId);
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

  ): Promise<WidgetResponseDto> {
    
    return this.widgetService.findOne(widgetId);
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
  ) {

    return this.widgetService.update(widgetId, updateWidgetDto);
  }

  @Delete(':widgetId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a widget' })
  @ApiResponse({ status: 200, description: 'Widget deleted successfully' })
  @ApiResponse({ status: 404, description: 'Widget not found' })
  async delete(
    @Param('widgetId', MongoDBObjectIdPipe) widgetId: string,
  ): Promise<void> {
    const deleted = await this.widgetService.delete(widgetId);
    if (!deleted) {
      throw new NotFoundException('Widget not found');
    }
  }
}
