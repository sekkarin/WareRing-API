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
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { DeviceResponseDto } from './dto/response-device.dto';
import { DevicesResponseDto } from './dto/get-all-device-dto';
@ApiTags('Device')
@Controller('device')
@Roles(Role.User)
@UseGuards(AuthGuard, RolesGuard)
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @ApiBearerAuth() // Assuming you're using bearer token authentication
  @ApiOperation({ summary: 'Create a new device' })
  @ApiBody({ type: CreateDeviceDto }) // Specify the request body DTO
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
  @Post()
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

  @ApiBearerAuth() // Assuming you're using bearer token authentication
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
  @Get()
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
  @Get(':id')
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
}
