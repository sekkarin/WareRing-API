import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as mongoose from 'mongoose';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';

import { AppModule } from '../src/app.module';
import { CreateDeviceDto } from 'src/device/dto/create-device.dto';
import { CreateWidgetDto } from 'src/widget/dto/create-widget.dto';

const createDeviceDto: CreateDeviceDto = {
  nameDevice: 'TestDevice',
  usernameDevice: 'test_username',
  password: 'password',
  description: 'Test device description',
  topics: 'test_topics',
  qos: 0,
  retain: true,
  isSaveData: true,
};
const createWidgetDto: CreateWidgetDto = {
  nameDevice: 'Test Widget',
  type: 'Test Type',
  configWidget: { key: 'value' }, // Example config
};

describe('Device (e2e)', () => {
  let app: INestApplication;
  const mongooseConnection = mongoose.connection;
  let accessToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    await signUp('user2');
    await signIn('user2', 'Password1234');
  });
  afterEach(async () => {
    if (mongooseConnection) {
      await mongooseConnection.close();
    }

    await app.close();
  });

  const signUp = async (username: string) => {
    await mongooseConnection.db.collection('users').insertOne({
      firstName: 'fname',
      lastName: 'lname',
      username,
      password: '$2b$10$gY4RF/bDlBqCNvaAtsJUqOCHQNQ5WWFwCgbMQiv4aCoQ5Ul9kdLHG',
      email: 'sekkri1234@gmail.com',
      roles: ['user'],
      isActive: true,
      verifired: true,
    });
  };

  const signIn = async (username: string, password: string) => {
    const signInResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username, password })
      .expect(HttpStatus.OK);

    accessToken = signInResponse.body.access_token;
  };
  describe('Widget E2E', () => {
    describe('POST widget', () => {
      it('should create a new widget', async () => {
        const response = await request(app.getHttpServer())
          .post('/widgets')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(createWidgetDto);

        // Assert that the response status code is 201 Created
        expect(response.status).toBe(201);
        // Assert that the response body contains the created widget data
        expect(response.body).toHaveProperty('id');
        expect(response.body.nameDevice).toBe(createWidgetDto.nameDevice);
        expect(response.body.type).toBe(createWidgetDto.type);
        // Add additional assertions as needed
      });
      it('should return 400 Bad Request if required fields are missing', async () => {
        const invalidCreateWidgetDto: Partial<CreateWidgetDto> = {}; // Missing required fields
        const response = await request(app.getHttpServer())
          .post('/widgets')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(invalidCreateWidgetDto);
        expect(response.status).toBe(400);
      });
      it('should return 400 Bad Request if input data is invalid', async () => {
        const invalidCreateWidgetDto: CreateWidgetDto = {
          nameDevice: 'Test Widget',
          type: '', // Invalid type
          configWidget: { key: 'value' },
        };
        const response = await request(app.getHttpServer())
          .post('/widgets')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(invalidCreateWidgetDto);
        expect(response.status).toBe(400);
      });
    });

   
  });
});
async function createDevice(
  app: INestApplication,
  accessToken: string,
  createDeviceDto: CreateDeviceDto,
) {
  return await request(app.getHttpServer())
    .post('/devices')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(createDeviceDto)
    .expect(HttpStatus.CREATED);
}
