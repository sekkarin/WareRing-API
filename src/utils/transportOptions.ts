import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();
// console.log(configService.getOrThrow("PORT"));


export const transportOptions = {
  transport: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: configService.get<string>('EMAIL_AUTH'),
      pass: configService.get<string>('PASS_AUTH'),
    },
  },
};
