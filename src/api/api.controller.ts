import { Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiService } from './api.service';
import { HttpService } from '@nestjs/axios';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/auth/enums/role.enum';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('api')
@Roles(Role.User)
@UseGuards(AuthGuard, RolesGuard)
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  // @Post('kick_device')
  // kickDevice() {
  //   return this.apiService.kickDevice();
  // }

  @Get()
  @ApiBearerAuth()
  @HttpCode(200)
  overview(@Req() req: Request) {
    try {
      const { sub } = req['user'];
      return this.apiService.overview(sub);
    } catch (error) {
     
      throw error;
    }
  }
}
