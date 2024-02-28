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
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import * as fs from 'fs';
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
import { storageFiles } from './../utils/storageFiles';
import { ConfigService } from '@nestjs/config';
import { BannedDto } from './dto/banned.dto';

// TODO: sort and filter get users
@ApiTags('User')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Put()
  @ApiBearerAuth()
  @Roles(Role.Admin, Role.User)
  @UseGuards(AuthGuard, RolesGuard)
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
      storage: storageFiles(),
      fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpg|png|jpeg)$/)) {
          return callback(new BadRequestException('Invalid file type'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5000,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  update(
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const protocol = req.protocol;
    const host = req.hostname;
    const originUrl = req.originalUrl;
    const fullUrl =
      protocol +
      '://' +
      host +
      `:${this.configService.get<string>('PORT')}` +
      originUrl +
      '/profile/';

    try {
      // TODO: delete image old
      // TODO: Refactor code and clean up
      // TODO: SAVE image when error
      // FIXME: dto update
      // FIXME: fix full path

      const id = req['user'].sub;
      //  console.log(req?.fileValidationError);

      if (Object.keys(updateUserDto).length === 0 && !file) {
        throw new BadRequestException(
          'Please provide at least one field to update.',
        );
      }

      const updatedUser = this.usersService.update(
        updateUserDto,
        id,
        file,
        fullUrl,
      );
      return updatedUser;
    } catch (error) {
      if (file) {
        const filePath = file.path;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
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

  @Get('search')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search all users, Roles Admin' }) // Operation summary
  @ApiQuery({
    name: 'query',
    type: String,
    required: false,
    description: 'string query to search',
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
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of user',
    type: UserResponseDto,
    isArray: true,
  })
  async searchDevices(
    @Req() req: Request,
    @Query('query') query: string,
    @Query() paginationQueryparamsDto: PaginationQueryparamsDto,
  ) {
    const { sub } = req['user'];
    const { page, limit } = paginationQueryparamsDto;
    return this.usersService.searchUsers(query, page, limit, sub);
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
  @ApiBearerAuth()
  @Roles(Role.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getUsers(
    @Req() req: Request,
    @Query() paginationQueryparamsDto: PaginationQueryparamsDto,
  ): Promise<PaginatedDto<UserResponseDto>> {
    const { page, limit } = paginationQueryparamsDto;
    const { sub } = req['user'];
    return await this.usersService.getAll(page, limit, sub);
  }

  @Delete()
  @Roles(Role.User)
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Delete a user', description: 'Roles Admin' }) // Operation summary
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
  @UseGuards(AuthGuard, RolesGuard)
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

  @Get('profile/:filename')
  async getProfilePicture(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    res.sendFile(filename, {
      root: './uploads/profiles/',
    });
  }
}
