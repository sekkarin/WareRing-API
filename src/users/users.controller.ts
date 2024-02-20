import { Request } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { UsersService } from './users.service';
import { Roles } from './../auth/decorator/roles.decorator';
import { Role } from './../auth/enums/role.enum';
import { AuthGuard } from './../auth/guards/auth.guard';
import { RolesGuard } from './../auth/guards/roles.guard';
import { GetUserAllDto, UpdateUserDto } from './dto/user.dto';
import { MongoDBObjectIdPipe } from 'src/utils/pipes/mongodb-objectid.pipe';
import { PaginatedDto } from 'src/utils/dto/paginated.dto';
import { UserResponseDto } from 'src/auth/dto/auth.dto';
import { PaginationQueryparamsDto } from 'src/device/dto/pagination-query-params.dto';
@ApiTags('User')
@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch()
  @ApiBearerAuth()
  @Roles(Role.Admin, Role.User)
  @UseGuards(AuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a user' }) // Operation summary
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: GetUserAllDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - some required data is missing',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - not authorized to perform this action',
  })
  @ApiResponse({ status: 404, description: 'Not Found - user not found' })
  @ApiBearerAuth() // Specify Bearer token authentication
  update(@Body() createCatDto: UpdateUserDto, @Req() req: Request) {
    try {
      const id = req['user'].sub;
      if (!createCatDto || Object.keys(createCatDto).length === 0) {
        throw new BadRequestException(
          'Invalid request - createCatDto is empty or null.',
        );
      }

      const updatedUser = this.usersService.update(createCatDto, id);
      return updatedUser;
    } catch (error) {
      throw new NotFoundException('User not found.');
    }
  }

  @ApiOperation({ summary: 'Update a user by ID' }) // Operation summary
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - some required data is missing',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - not authorized to perform this action',
  })
  @ApiResponse({ status: 404, description: 'Not Found - user not found' })
  @ApiParam({ name: 'id', description: 'User ID' }) // Parameter description
  @ApiBearerAuth() // Specify Bearer token authentication
  @Roles(Role.Admin, Role.User)
  @UseGuards(AuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @Patch(':id')
  async updateById(
    @Body() createCatDto: UpdateUserDto,
    @Param() params: { id: string },
  ) {
    try {
      if (!createCatDto || Object.keys(createCatDto).length === 0) {
        throw new BadRequestException(
          'Invalid request - createCatDto is empty or null.',
        );
      }
      const updatedUser = await this.usersService.update(
        createCatDto,
        params.id,
      );

      return updatedUser;
    } catch (error) {
      throw new NotFoundException('User not found.');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' }) // Operation summary
  @ApiResponse({
    status: 200,
    description: `Get all users`,
    type: [GetUserAllDto],
  }) // Response description
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
  @ApiBearerAuth()
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  async getUsers(
    @Req() req: Request,
    @Query() paginationQueryparamsDto: PaginationQueryparamsDto,
  ): Promise<PaginatedDto<UserResponseDto>> {
    const { page, limit } = paginationQueryparamsDto;
    const { sub } = req['user'];
    return await this.usersService.getAll(page, limit, sub);
  }

  @Delete(':id')
  @Roles(Role.User)
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Delete a user by ID', description: 'Roles Admin' }) // Operation summary
  @ApiParam({ name: 'id', description: 'User ID' }) // Parameter description
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - some required data is missing',
  })
  @ApiResponse({ status: 404, description: 'Not Found - user not found' })
  @ApiBearerAuth()
  async deleteUser(@Param() params: { id: string }) {
    // console.log(params.id);

    if (!params.id) {
      throw new BadRequestException('Some required data is missing.');
    }
    try {
      await this.usersService.deleteUser(params.id);
      return {
        message: 'delete user successfully',
      };
    } catch (error) {
      throw new NotFoundException('User not found.');
    }
  }

  @Get(':id')
  @Roles(Role.User)
  @ApiOperation({ summary: 'Get user by id' }) // Operation summary
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: GetUserAllDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - some required data is missing',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - not authorized to perform this action',
  })
  @ApiResponse({ status: 404, description: 'Not Found - user not found' })
  @ApiBearerAuth()
  async getUser(
    @Req() req: Request,
    @Param('id', MongoDBObjectIdPipe) id: string,
  ) {
    const { sub } = req['user'];
    try {
      if (id !== sub) {
        throw new ForbiddenException(
          'You are not authorized to access this resource',
        );
      }
      return await this.usersService.findOneById(id);
    } catch (error) {
      throw error;
    }
  }
}
