import { Controller, Get, HttpCode, Req, UseGuards } from '@nestjs/common';
import { ApiService } from './api.service';
import { Roles } from './../auth/decorator/roles.decorator';
import { AuthGuard } from './../auth/guards/auth.guard';
import { RolesGuard } from './../auth/guards/roles.guard';
import { Role } from './../auth/enums/role.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsActivateUser } from 'src/users/guard/active.guard';
import { SkipThrottle} from '@nestjs/throttler';

@Controller('api')
@ApiTags('Api')
@Roles(Role.User)
@SkipThrottle()
@UseGuards(AuthGuard, RolesGuard, IsActivateUser)
export class ApiController {
  constructor(private readonly apiService: ApiService) {}
  @Get('overview')
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
