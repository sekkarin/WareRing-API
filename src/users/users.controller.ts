import { Request, Response } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
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
import { MongoDBObjectIdPipe } from './../utils/pipes/mongodb-objectid.pipe';
import { PaginatedDto } from './../utils/dto/paginated.dto';
import { UserResponseDto } from './../auth/dto/auth.dto';
import { PaginationQueryparamsDto } from './../device/dto/pagination-query-params.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { BannedDto } from './dto/banned.dto';
import { Throttle } from '@nestjs/throttler';
import { IsActivateUser } from './guard/active.guard';
import * as multer from 'multer';
import { ManageFileS3Service } from 'src/utils/services/up-load-file-s3/up-load-file-s3.service';
import { ResetNewPasswordDTO } from './dto/reset-new-password.DTO';

@ApiTags('User')
@Controller('users')
@Throttle({ default: { limit: 60, ttl: 60000 } })
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly uploadFileS3Service: ManageFileS3Service,
  ) {}

  @Put()
  @ApiBearerAuth()
  @Roles(Role.Admin, Role.User)
  @UseGuards(AuthGuard, RolesGuard, IsActivateUser)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a user' }) // Operation summary
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
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
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpg|png|jpeg)$/)) {
          return callback(new BadRequestException('Invalid file type'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5000000,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  async update(
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      const id = req['user'].sub;
      let nameFile: string | undefined = undefined;

      if (file) {
        nameFile = await this.uploadFileS3Service.uploadFile(file);
      }
      if (Object.keys(updateUserDto).length === 0 && !file) {
        throw new BadRequestException(
          'Please provide at least one field to update.',
        );
      }

      const updatedUser = this.usersService.updateUser(
        updateUserDto,
        id,
        nameFile,
      );
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  @Put('banned/:id')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Set user banned state,Roles Admin' }) // เพิ่มคำอธิบายสำหรับ API Endpoint
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiBearerAuth()
  async setBanned(
    @Body() banned: BannedDto,
    @Param('id', MongoDBObjectIdPipe) id: string,
  ) {
    try {
      const bannedState = banned.banned;
      return this.usersService.setBanned(bannedState, id);
    } catch (error) {
      console.log(error);

      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all users Roles Admin' }) // Operation summary
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
  @ApiQuery({
    name: 'query',
    type: String,
    required: false,
    description: 'Page number for pagination (default: 1)',
  })
  @ApiQuery({
    name: 'createdAt',
    enum: ['+createdAt', '-createdAt'],
    required: false,
    description: 'limit Number of items  (default: 10)',
  })
  @ApiBearerAuth()
  @Roles(Role.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getUsers(
    @Req() req: Request,
    @Query() paginationQueryparamsDto: PaginationQueryparamsDto,
  ): Promise<PaginatedDto<UserResponseDto>> {
    const { page, limit, query, createdAt } = paginationQueryparamsDto;
    const { sub } = req['user'];
    return await this.usersService.getAll(query, page, limit, createdAt, sub);
  }

  @Delete()
  @Roles(Role.User)
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, RolesGuard, IsActivateUser)
  @ApiOperation({ summary: 'Delete a user', description: 'Roles User' }) // Operation summary
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - some required data is missing',
  })
  @ApiResponse({ status: 404, description: 'Not Found - user not found' })
  @ApiBearerAuth()
  async deleteUser(@Req() req: Request) {
    try {
      const { sub } = req['user'];

      await this.usersService.deleteUser(sub);
      return {
        message: 'delete user successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  @Roles(Role.User)
  @UseGuards(AuthGuard, RolesGuard, IsActivateUser)
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

  @Delete('/profile')
  @Roles(Role.User)
  @UseGuards(AuthGuard, RolesGuard, IsActivateUser)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete profile image' })
  @ApiResponse({
    status: 200,
    description: 'Profile image deleted successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or profileUrl not set.',
  })
  async deleteProfileImage(@Req() req: Request) {
    try {
      const { sub } = req['user'];
      return this.usersService.deleteProfileImage(sub);
    } catch (error) {
      throw error;
    }
  }

  @Post('/reset-password')
  @Roles(Role.User)
  @UseGuards(AuthGuard, RolesGuard, IsActivateUser)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reset user password' })
  @ApiResponse({
    status: 200,
    description: 'Password has been successfully reset.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 400, description: 'Old password is incorrect.' })
  resetPassword(
    @Req() req: Request,
    @Body() resetNewPasswordDTO: ResetNewPasswordDTO,
  ) {
    try {
      const { sub } = req['user'];

      return this.usersService.resetNewPassword(sub, resetNewPasswordDTO);
    } catch (error) {
      throw error;
    }
  }
}
