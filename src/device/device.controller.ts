import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Req,
  HttpCode,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { DeviceService } from './device.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Roles } from './../auth/decorator/roles.decorator';
import { Role } from './../auth/enums/role.enum';
import { AuthGuard } from './../auth/guards/auth.guard';
import { RolesGuard } from './../auth/guards/roles.guard';
import { DeviceResponseDto } from './dto/response-device.dto';
import { DevicesResponseDto } from './dto/get-all-device-dto';
import { PermissionsDto } from './dto/permission.dto';
import { StoreDataDto } from './dto/store-data.dto';
import { PaginatedDto } from 'src/utils/dto/paginated.dto';
import { PaginationQueryparamsDto } from './dto/pagination-query-params.dto';
import { MongoDBObjectIdPipe } from '../utils/pipes/mongodb-objectid.pipe';
import { Throttle } from '@nestjs/throttler';
import { IsActivateUser } from 'src/users/guard/active.guard';
import { WinstonLoggerService } from 'src/logger/logger.service';
import { CustomLoggerInterceptor } from 'src/utils/interceptors/customLoggerInterceptor';
@ApiTags('Device')
@Controller('devices')
@Roles(Role.User)
@Throttle({ default: { limit: 120, ttl: 60000 } })
@UseInterceptors(CustomLoggerInterceptor)
@UseGuards(AuthGuard, RolesGuard, IsActivateUser)
export class DeviceController {
  constructor(
    private readonly deviceService: DeviceService,
    private readonly logger: WinstonLoggerService,
  ) {}

  @Post()
  @HttpCode(201)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new device' })
  @ApiBody({ type: CreateDeviceDto })
  @ApiResponse({
    status: 201,
    description: 'Device created successfully',
    type: DeviceResponseDto, // Specify the response DTO
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
  })
  async create(
    @Req() req: Request,
    @Body() createDeviceDto: CreateDeviceDto,
  ): Promise<DeviceResponseDto> {
    const { sub } = req['user'];
    this.logger.info(
      `User ${req['user'].sub} created device ${createDeviceDto.nameDevice}`,
      DeviceController.name
    );
    try {
      const device = await this.deviceService.create(createDeviceDto, sub);
      return device;
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get a paginated list of devices',
    description:
      'Returns a paginated list of devices based on the provided parameters.',
  })
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
  @ApiQuery({
    name: 'isSaveData',
    type: Boolean,
    required: false,
    description: 'limit Number of items  (default: 10)',
  })
  @ApiQuery({
    name: 'permission',
    enum: ['allow', 'deny'],
    required: false,
    description: 'limit Number of items  (default: 10)',
  })
  @ApiQuery({
    name: 'createdAt',
    enum: ['+createdAt', '-createdAt'],
    required: false,
    description: 'limit Number of items  (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of devices',
    type: DevicesResponseDto,
    isArray: true,
  })
  async findAll(
    @Req() req: Request,
    @Query() paginationQueryparamsDto: PaginationQueryparamsDto,
  ): Promise<PaginatedDto<DeviceResponseDto>> {
    try {
      const { sub } = req['user'];
      const { page, limit, createdAt, isSaveData, permission, query } =
        paginationQueryparamsDto;

      const getDevicesFilterDto = { isSaveData, permission };

      return await this.deviceService.findAll(
        query,
        page,
        limit,
        sub,
        createdAt,
        getDevicesFilterDto,
      );
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get Device by ID',
    description:
      'Fetches details of a device based on the provided ID, requiring user authentication and specific roles.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'ID of the device' })
  @ApiResponse({
    status: 200,
    description: 'Returns the details of a device by ID',
    type: DeviceResponseDto, // Assuming you have a DTO for the device response
  })
  findOne(@Req() req: Request, @Param('id', MongoDBObjectIdPipe) id: string) {
    try {
      this.logger.log(
        `User ${req['user'].sub} get device`,
        DeviceController.name
      );
      const { sub } = req['user'];

      return this.deviceService.findOne(id, sub);
    } catch (error) {
      throw error;
    }
  }

  @Put(':id')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a device by ID' })
  @ApiResponse({
    status: 200,
    description: 'Device updated successfully',
    type: DeviceResponseDto, // Assuming you have a DeviceResponseDto for the response
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  @ApiResponse({
    status: 404,
    description: 'Device not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
  })
  async update(
    @Req() req: Request,
    @Param('id', MongoDBObjectIdPipe) id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    this.logger.info(
      `User ${req['user'].sub} update device ${id}`,
      DeviceController.name
    );
    try {
      const { sub } = req['user'];
      const device = await this.deviceService.update(id, sub, updateDeviceDto);

      return device;
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a device by ID' })
  @ApiResponse({
    status: 200,
    description: 'Device deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid request or parameters',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - User does not have permission to delete the device',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Device not found',
  })
  @ApiResponse({
    status: 500,
    description:
      'Internal Server Error - Unexpected error during device deletion',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the device to delete',
  })
  async delete(
    @Req() req: Request,
    @Param('id', MongoDBObjectIdPipe) id: string,
  ) {
    this.logger.info(
      `User ${req['user'].sub} delete device ${id}`,
      DeviceController.name
    );
    try {
      const { sub } = req['user'];

      await this.deviceService.delete(id, sub);

      return {
        message: 'device deleted successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  @Put('permission/:id')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set permission for a device' }) // Operation summary
  @ApiResponse({
    status: 200,
    description: 'Permission set successfully',
    type: DeviceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async setStatus(
    @Req() req: Request,
    @Param('id', MongoDBObjectIdPipe) id: string,
    @Body() setPermissions: PermissionsDto,
  ) {
    this.logger.info(
      `User ${req['user'].sub} set permission device ${id}`,
      DeviceController.name
    );
    try {
      const { sub } = req['user'];

      const { permission } = setPermissions;
      const device = await this.deviceService.setPermission(
        permission,
        sub,
        id,
      );

      return device;
    } catch (error) {
      throw error;
    }
  }

  @Put('store/:id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Set store data for a device' })
  @ApiParam({ name: 'id', description: 'ID of the device' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Store data updated successfully',
    type: DeviceResponseDto, // Your response DTO
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async setStoreData(
    @Req() req: Request,
    @Param('id', MongoDBObjectIdPipe) id: string,
    @Body() storeDataDto: StoreDataDto,
  ) {
    this.logger.info(
      `User ${req['user'].sub} set store device ${id}`,
      DeviceController.name
    );
    try {
      const { sub } = req['user'];
      const { storeData } = storeDataDto;
      const device = await this.deviceService.setStoreData(storeData, sub, id);
      return device;
    } catch (error) {
      throw error;
    }
  }
}
