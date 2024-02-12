import { Controller, Post } from '@nestjs/common';
import { ApiService } from './api.service';

@Controller('api')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}


  @Post("kick_device")
  kickDevice(){
    return this.apiService.kickDevice()
  }
}
