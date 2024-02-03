import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as mongoose from 'mongoose';
describe('Device (e2e)', () => {
  let app: INestApplication;
  let access_token: string;
  let refresh_Token: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
    // await mongooseConnection.db.dropCollection('users');
    // await mongooseConnection.db.dropCollection('devices');
    try {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'john.doedevice@example.com',
          password: '1234567Test',
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoetestdevice',
        })
        .expect(HttpStatus.CREATED);
        // เรียกสองครั้ง
      const signInResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'johndoetestdevice',
          password: '1234567Test',
        })
        .expect(HttpStatus.OK);
      access_token = signInResponse.body.access_token;
      refresh_Token = signInResponse.get('Set-Cookie')[0];
    } catch (error) {
      // console.log(error);
      
    }
  });

  describe('Create a new device', () => {
    it('should create a new device status 200', async () => {
      const device = await request(app.getHttpServer())
        .post('/device')
        .set('Cookie', refresh_Token)
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
    it('should return a validation error if DTO is invalid', async () => {
      // Provide invalid data to intentionally fail validation
      const invalidDtoData = {
        nameDevice: '', // Invalid, as it should not be empty
        usernameDevice: 'device_username',
        password: 'hashed_password',
        description: 'Smart home controller',
        topics: ['topic1', 'topic2'],
        qos: '0',
        retain: true,
        isSaveData: true,
      };

      const response = await request(app.getHttpServer())
        .post('/device')
        .set('Cookie', refresh_Token)
        .set('Authorization', `Bearer ${access_token}`)
        .send(invalidDtoData)
        .expect(HttpStatus.BAD_REQUEST);

      // Ensure that the response contains a message about the validation error
      // console.log(response.body);

      expect(response.body.error).toBeDefined()
      // expect(response.body.message).toContain('nameDevice should not be empty');

      // Add more assertions based on your requirements
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
