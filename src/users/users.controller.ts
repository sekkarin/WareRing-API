import { Request, Response } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HostParam,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Put,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
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
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadDto } from './dto/file-upload.dto';
import { storageFiles } from 'src/utils/storageFiles';
import { hostname } from 'os';
import { ConfigService } from '@nestjs/config';
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
  @UseInterceptors(
    FileInterceptor('file', {
      storage: storageFiles(),
      fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpg|png|jpeg|gif)$/)) {
          return callback(null, false);
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  update(
    @Body() createCatDto: UpdateUserDto,
    @Req() req: Request,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      // TODO: delete image old
      // TODO: Refactor code and clean up
      console.log(file);
      // console.log(req.hostname);
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
      console.log(fullUrl);

      // const host = req.hostname;

      const id = req['user'].sub;
      if (!createCatDto || Object.keys(createCatDto).length === 0) {
        throw new BadRequestException(
          'Invalid request - createCatDto is empty or null.',
        );
      }

      const updatedUser = this.usersService.update(
        createCatDto,
        id,
        file,
        fullUrl,
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
