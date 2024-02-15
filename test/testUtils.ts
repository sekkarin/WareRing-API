import { HttpStatus, INestApplication } from '@nestjs/common';
import { BodyUserLoginDto } from 'src/auth/dto/auth.dto';
import * as request from 'supertest';

export const login = async (app: INestApplication) => {
  await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      email: 'device@example.com',
      password: '1234567Device',
      firstName: 'device',
      lastName: 'device',
      username: 'device',
    })
    .expect(HttpStatus.CREATED);
  const loginBody: BodyUserLoginDto = {
    username: 'device',
    password: '1234567Device',
  };

  const signInResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send(loginBody);
  return {
    refresh_token: signInResponse.get('Set-Cookie'),
    access_token: signInResponse.body.access_token,
  };
};
// export const register = async (app: INestApplication) => {
//   const response = await request(app.getHttpServer())
//     .post('/auth/register')
//     .send({
//       email: 'john.doeDevice@example.com',
//       password: '1234567Test',
//       firstName: 'John',
//       lastName: 'Doe',
//       username: 'johndoetestdevice',
//     })
//     .expect(201);

//   return response.body;
// };
