import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as mongoose from 'mongoose';
import {  login } from './testUtils';

describe('Device (e2e)', () => {
  let app: INestApplication;
  const mongooseConnection = mongoose.connection;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    const collections = await mongooseConnection.db.collections();

    for (const collection of collections) {
      await collection.deleteMany({});
    }
    // await register(app);
  });


  afterAll(async () => {
    if (mongooseConnection) {
      await mongooseConnection.close();
    }
  });

  describe('Create a new device', () => {
    it('should create a new device status 200', async () => {
      const { access_token, refresh_token } = await login(app);
      console.log(access_token, refresh_token);

      const device = await request(app.getHttpServer())
        .post('/device')
        .set('Cookie', refresh_token)
        .set('Authorization', `Bearer ${access_token}`)
        .send({
          nameDevice: 'MyDevice',
          usernameDevice: 'device_username',
          password: 'hashed_password',
          description: 'Smart home controller',
          topics: ['topic1', 'topic2'],
          qos: '0',
          retain: true,
          isSaveData: true,
        })
        .expect(HttpStatus.CREATED);
      expect(device.body.usernameDevice).toBe('device_username');
      expect(device.body.permission).toBeDefined();
    });
    // it('should return a validation error if DTO is invalid', async () => {
    //   const { access_token, refresh_token } = await login(app);
    //   console.log(access_token, refresh_token);
    //   const invalidDtoData = {
    //     nameDevice: '',
    //     usernameDevice: 'device_username',
    //     password: 'hashed_password',
    //     description: 'Smart home controller',
    //     topics: ['topic1', 'topic2'],
    //     qos: '0',
    //     retain: true,
    //     isSaveData: true,
    //   };

    //   const device = await request(app.getHttpServer())
    //     .post('/device')
    //     .set('Cookie', refresh_token)
    //     .set('Authorization', `Bearer ${access_token}`)
    //     .send(invalidDtoData)
    //     .expect(HttpStatus.BAD_REQUEST);

    //   // Ensure that the response contains a message about the validation error
    //   console.log(device.body);

    //   // expect(response.body.error).toBeDefined();
    //   // expect(response.body.message).toContain('nameDevice should not be empty');

    //   // Add more assertions based on your requirements
    // });
  });

  afterEach(async () => {
    await app.close();
  });
});
