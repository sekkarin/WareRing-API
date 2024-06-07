import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/auth/enums/role.enum';
import { CustomLoggerInterceptor } from 'src/utils/interceptors/customLoggerInterceptor';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PaginationQueryparamsDto } from 'src/device/dto/pagination-query-params.dto';
import { MongoDBObjectIdPipe } from 'src/utils/pipes/mongodb-objectid.pipe';
import { UpdateActiveApiKeyDto } from './dto/update-active-api-key.dto';

@Controller('api-key')
@ApiTags('ApiKey (Admin)')
@ApiBearerAuth()
@Roles(Role.Admin)
@Throttle({ default: { limit: 30, ttl: 60000 } })
@UseInterceptors(CustomLoggerInterceptor)
@UseGuards(AuthGuard, RolesGuard)
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  create(@Body() createApiKeyDto: CreateApiKeyDto) {
    return this.apiKeyService.create(createApiKeyDto);
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
  @ApiQuery({
    name: 'createdAt',
    enum: ['+createdAt', '-createdAt'],
    required: false,
    description: 'limit Number of items  (default: 10)',
  })
  findAll(@Query() paginationQueryparamsDto: PaginationQueryparamsDto) {
    const { page, limit, createdAt, query } = paginationQueryparamsDto;
    return this.apiKeyService.findAll(page, limit, createdAt, query);
  }

  @Get(':id')
  findOne(@Param('id', MongoDBObjectIdPipe) id: string) {
    return this.apiKeyService.findOne(id);
  }
  @Patch(':id')
  async updateApiKeyStatus(
    @Param('id', MongoDBObjectIdPipe) id: string,
    @Body() updateActiveApiKeyDto: UpdateActiveApiKeyDto,
  ) {
    return this.apiKeyService.updateStatus(id, updateActiveApiKeyDto);
  }

  @Delete(':id')
  remove(@Param('id', MongoDBObjectIdPipe) id: string) {
    return this.apiKeyService.remove(id);
  }
}
