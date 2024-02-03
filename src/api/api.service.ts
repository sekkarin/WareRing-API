import { HttpService } from '@nestjs/axios';
import { Injectable, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private async loginDashboard() {
    try {
      const res = await this.httpService.axiosRef.post(
        this.configService.get<string>('EMQX_API') + '/login',
        {
          username: this.configService.get<string>(
            'EMQX_DASHBOARD_ADMIN_USERNAME',
          ),
          password: this.configService.get<string>(
            'EMQX_DASHBOARD_ADMIN_PASSWORD',
          ),
        },
      );

      console.log(res.data);
      return { token: res.data.token };
    } catch (error) {
      throw error;
    }
  }

  bannedDevices() {
    return {};
  }
  createApiToken() {
    return {};
  }
  listeners() {
    return {};
  }

  async kickDevice() {
    try {
      const res = await this.httpService.axiosRef.post(
        this.configService.get<string>('EMQX_API') + '/clients/kickout/bulk',
        ['96b5b0de-66c3-406d-bfbb-04c6617bf5aa1706944451899'],
        {
          headers: {
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MDY5NDgyNDkzNjQsImlzcyI6IkVNUVgifQ.7DxydhQPGiVNJFNEZlVtieK4uPsiHE-0C4WMb8_uXJI`,
            // Authorization: `Bearer ${(await this.loginDashboard()).token}`,
          },
        },
      );
      console.log(res.data, res.status);
  
      return res.data;
    } catch (error) {
      console.log(error);
      
    }
  
  }
}
