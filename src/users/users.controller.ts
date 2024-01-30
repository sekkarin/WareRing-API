import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { UsersService } from './users.service';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreateUserDto, GetUserAllDto, UpdateUserDto } from './dto/user.dto';
import { Request } from 'express';

@ApiTags('User')
@Controller('users')
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
  @ApiTags("UserRoles")
  update(@Body() createCatDto: UpdateUserDto, @Req() req: Request) {
    try {
      const id = req['user'].sub;
      if (!createCatDto || Object.keys(createCatDto).length === 0) {
        throw new BadRequestException(
          'Invalid request - createCatDto is empty or null.',
        );
      }
      
      const updatedUser =  this.usersService.update(createCatDto, id);
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
  @ApiTags("AdminRoles")
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
  // @ApiOperation({ summary: 'Get all users' }) // Operation summary
  // @ApiResponse({
  //   status: 200,
  //   description: `Get all users`,
  //   type: [GetUserAllDto],
  // }) // Response description
  // @ApiBearerAuth()
  // @Roles(Role.Admin)
  // @UseGuards(AuthGuard, RolesGuard)
  // @HttpCode(HttpStatus.OK)
  // @ApiTags("AdminRoles")
  async getUsers() {
    return await this.usersService.getAll();
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
  @ApiTags("AdminRoles")
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

  @Get(':username')
  // @Roles(Role.Admin, Role.User)
  // @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get user by username' }) // Operation summary
  @ApiParam({
    name: 'username',
    description: 'Username of the user to retrieve',
  }) // Parameter description
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
  @ApiTags("UserRoles","AdminRoles")
  async getUser(@Param() params: { username: string }) {
    if (!params.username) {
      throw new BadRequestException('Some required data is missing.');
    }
    try {
      return await this.usersService.getUserById(params.username);
    } catch (error) {
      throw new NotFoundException('User not found.');
    }
  }
}
