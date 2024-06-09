// import { HttpStatus, INestApplication } from '@nestjs/common';
// import { Test, TestingModule } from '@nestjs/testing';
// import cookieParser from 'cookie-parser';
// import * as request from 'supertest';
// import * as mongoose from 'mongoose';
// import { AppModule } from 'src/app.module';

// declare global{
//   namespace NodeJS{
//     interface Global{
//       register(): Promise<string[]>
//     }
//   }
// }

// global.register = async () => {
//   const username = 'johndoe';
//   const password = 'Password123P';

//   let app: INestApplication;

//   const moduleFixture: TestingModule = await Test.createTestingModule({
//     imports: [AppModule],
//   }).compile();
//   app = moduleFixture.createNestApplication();
//   app.use(cookieParser());
//   await app.init();

//   const response = await request(app.getHttpServer())
//     .post('/auth/register')
//     .send({
//       email: 'john.doe@example.com',
//       password: '1234567Test',
//       firstName: 'John',
//       lastName: 'Doe',
//       username: 'johndoe',
//     })
//     .expect(HttpStatus.CREATED);
// };
