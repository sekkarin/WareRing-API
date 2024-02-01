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
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @ApiBearerAuth() // Assuming you're using bearer token authentication
  @Roles(Role.User) // Specify the required roles
  @UseGuards(AuthGuard, RolesGuard) // Use the specified guards
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

  @Get()
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
    @Query('page') page = 1,
    @Query('perPage') perPage = 10,
  ): Promise<DevicesResponseDto> {
    try {
      const response: DevicesResponseDto = {
        data: await this.deviceService.findAll(page, perPage),
        metadata: { page: page, perPages: perPage },
      };
      return response;
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deviceService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDeviceDto: UpdateDeviceDto) {
    return this.deviceService.update(+id, updateDeviceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deviceService.remove(+id);
  }
}
