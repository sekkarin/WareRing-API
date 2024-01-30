import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { Roles } from './decorator/roles.decorator';
import { Role } from './enums/role.enum';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from 'src/users/dto/user.dto';
import {
  AccessTokenResponseDto,
  BodyUserLoginDto,
  UserResponseDto,
} from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService, // private myLogger: MyLoggerService// private jwtService: JwtService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' }) // Operation summary
  @ApiResponse({
    status: 200,
    description: `User logged in successfully  access token   payload = {
      sub: string,
      username: string,
      roles:array
    } 
    EXPIRES = 6  days
    `,
    type: AccessTokenResponseDto,
    headers: {
      refresh_token: {
        description: 'Cookie to store the refresh token for authentication.',
        schema: {
          type: 'string',
        },
        example:
          'refresh_token=myRefreshToken; HttpOnly; SameSite=None; Secure; Max-Age=518,400,000 or 6 day',
      },
    },
  }) // Response description
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Array of validation error messages',
  })
  @ApiResponse({
    status: 403,
    description: 'Unauthorized - incorrect or missing credentials',
  })
  async signIn(@Body(ValidationPipe) signInDto: BodyUserLoginDto, @Res() res: Response) {
  
    const user = await this.authService.signIn(
      signInDto.username,
      signInDto.password,
    );
    res.cookie('refresh_token', user.refresh_token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true, // prod needed!
      maxAge: 6 * 24 * 60 * 60 * 1000, // 6 day in ms unit
    });
    return res.status(200).json({ access_token: user.access_token });
  }

  @ApiOperation({ summary: 'User registration' }) // Operation summary
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
    type: UserResponseDto,
  }) // Response description
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Array of validation error messages',
    
  })
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async signUp(@Body(ValidationPipe) signUpDto: CreateUserDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('logout')
  @ApiBearerAuth()
  @Roles(Role.Admin, Role.User)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({ summary: 'User logout' }) // Operation summary
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  @ApiTags('UserRoles', 'AdminRoles')
  async logOut(@Req() req: Request, @Res() res: Response) {
    const username = req.user.username;
    await this.authService.logOut(username);
    res.clearCookie('refresh_token');
    res.status(200).json({ message: "logout's" });
  }

  @Get('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using a refresh token' }) // Operation summary
  @ApiResponse({
    status: 200,
    description: 'Access token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'New access token',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  }) // Response description
  @ApiResponse({
    status: 400,
    description: 'Unauthorized - missing refresh token',
    
  })
  @ApiCookieAuth('refresh_token')
  @ApiBearerAuth()
  async refresh(@Req() request: Request, @Res() res: Response) {
    const cookies = request.cookies;
    if (!cookies.refresh_token) {
      throw new UnauthorizedException();
    }
    const access_token = await this.authService.refresh(cookies.refresh_token);
    res.status(200).json({ access_token });
  }
}
