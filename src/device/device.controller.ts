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
  InternalServerErrorException,
  Query,
  HttpStatus,
  HttpCode,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProperty,
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
@ApiTags('Device')
@Controller('device')
@Roles(Role.User)
@UseGuards(AuthGuard, RolesGuard)
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post()
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
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
  })
  async create(
    @Req() req: Request,
    @Body() createDeviceDto: CreateDeviceDto,
  ): Promise<DeviceResponseDto> {
    const { sub } = req['user'];
    try {
      return await this.deviceService.create(createDeviceDto, sub);
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
    name: 'page',
    type: Number,
    required: false,
    description: 'Page number for pagination (default: 1)',
  })
  @ApiQuery({
    name: 'perPage',
    type: Number,
    required: false,
    description: 'Number of items per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of devices',
    type: DevicesResponseDto,
    isArray: true,
  })
  async findAll(
    @Req() req: Request,
    @Query('page') page = 1,
    @Query('perPage') perPage = 10,
  ): Promise<DevicesResponseDto> {
    try {
      const { sub } = req['user'];
      const response: DevicesResponseDto = {
        data: await this.deviceService.findAll(page, perPage, sub),
        metadata: { page: page, perPages: perPage },
      };
      return response;
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
  findOne(@Req() req: Request, @Param('id') id: string) {
    try {
      const { sub } = req['user'];
      return this.deviceService.findOne(id, sub);
    } catch (error) {
      console.log(error);

      throw error;
    }
  }

  @Patch(':id')
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
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    try {
      const { sub } = req['user'];
      return this.deviceService.update(id, sub, updateDeviceDto);
    } catch (error) {
      console.log(error);

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
  delete(@Req() req: Request, @Param('id') id: string) {
    try {
      const { sub } = req['user'];
      this.deviceService.delete(id, sub);
      return {
        message: 'device deleted',
      };
    } catch (error) {
      console.log(error);
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
  setStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() setPermissions: PermissionsDto,
  ) {
    try {
      const { sub } = req['user'];
      const { permission } = setPermissions;
      return this.deviceService.setPermission(permission, sub, id);
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
  setStoreData(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() storeDataDto: StoreDataDto,
  ) {
    try {
      const { sub } = req['user'];
      const { storeData } = storeDataDto;

      return this.deviceService.setStoreData(storeData, sub, id);
    } catch (error) {
      throw error;
    }
  }
}
