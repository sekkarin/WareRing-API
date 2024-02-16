import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as mongoose from 'mongoose';
import { CreateDeviceDto } from 'src/device/dto/create-device.dto';

describe('Device (e2e)', () => {
  let app: INestApplication;
  const mongooseConnection = mongoose.connection;
  let access_token: string;

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
    await signUp('user2', 'Password1234');
    // const signInResponse = await signIn('user2', 'Password1234');
    // access_token = signInResponse.body.access_token;
  });
  afterEach(async () => {
    await app.close();
  });

  const signUp = async (username: string, password: string) => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `${username}@example.com`,
        password,
        firstName: 'user',
        lastName: 'user',
        username,
      })
      .expect(HttpStatus.CREATED);
  };

  const signIn = async (username: string, password: string) => {
    const signInResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username, password })
      .expect(HttpStatus.OK);

    access_token = signInResponse.body.access_token;
  };

  describe('Post /devices ', () => {
    it('should create a new device status 200', async () => {
      // await signUp('user2', 'Password123');
      await signIn('user2', 'Password1234');
      const deviceDataMock: CreateDeviceDto = {
        nameDevice: 'MyDevice',
        usernameDevice: 'device_username_1',
        password: 'hashed_password',
        description: 'Smart home controller',
        topics: ['topic1', 'topic2'],
        qos: 0,
        retain: true,
        isSaveData: true,
      };
      const device = await request(app.getHttpServer())
        .post('/devices')
        .set('Authorization', `Bearer ${access_token}`)
        .send(deviceDataMock)
        .expect(HttpStatus.CREATED);
      expect(device.body.usernameDevice).toBe('device_username_1');
      expect(device.body.permission).toBeDefined();
    });

    it('should return 400 if device with usernameDevice already exists', async () => {
      // await signUp('user2', 'Password123');
      await signIn('user2', 'Password1234');

      const deviceExisting: CreateDeviceDto = {
        nameDevice: 'MyDevice',
        usernameDevice: 'device_username_2',
        password: 'hashed_password',
        description: 'Smart home controller',
        topics: ['topic1', 'topic2'],
        qos: 0,
        retain: true,
        isSaveData: true,
      };

      // Create a device with a specific username
      await request(app.getHttpServer())
        .post('/devices')
        .set('Authorization', `Bearer ${access_token}`)
        .send(deviceExisting)
        .expect(HttpStatus.CREATED); // Update to expect CREATED status

      // Attempt to create another device with the same username, expect 400
      await request(app.getHttpServer())
        .post('/devices')
        .set('Authorization', `Bearer ${access_token}`)
        .send(deviceExisting)
        .expect(HttpStatus.BAD_REQUEST); // Expect BAD_REQUEST status
    });

    it('should return 400 when creating device with invalid payload', async () => {
      await signIn('user2', 'Password1234');
      const invalidPayload = {};
      const response = await request(app.getHttpServer())
        .post('/devices')
        .send(invalidPayload)
        .set('Authorization', `Bearer ${access_token}`)
        .expect(HttpStatus.BAD_REQUEST);

      // Assert that the response contains details about validation errors
      expect(response.body.message).toContain('nameDevice should not be empty');
      expect(response.body.message).toContain('nameDevice must be a string');
      expect(response.body.message).toContain(
        'usernameDevice should not be empty',
      );
      expect(response.body.message).toContain(
        'usernameDevice must be a string',
      );
    });
  });

  describe('GET /devices', () => {
    it('should return a paginated list of devices with default parameters', async () => {
      await signIn('user2', 'Password1234');
      const response = await request(app.getHttpServer())
        .get('/devices?page=1&perPage=10')
        .set('Authorization', `Bearer ${access_token}`)
        .expect(HttpStatus.OK);
      // Add assertions for the response here
      expect(response.body.data).toBeDefined();
      expect(response.body.metadata).toBeDefined();
    });

    it('should return a paginated list of devices with custom pagination parameters', async () => {
      await signIn('user2', 'Password1234');
      const response = await request(app.getHttpServer())
        .get('/devices?page=2&perPage=5')
        .set('Authorization', `Bearer ${access_token}`)
        .expect(HttpStatus.OK);
      // Add assertions for the response here
      expect(response.body.data).toBeDefined();
      expect(response.body.metadata).toBeDefined();
    });

    it('should handle invalid pagination parameters', async () => {
      await signIn('user2', 'Password1234');
      const response = await request(app.getHttpServer())
        .get('/devices?page=-1&perPage=abc')
        .set('Authorization', `Bearer ${access_token}`)
        .expect(HttpStatus.BAD_REQUEST);
      // Add assertions for the response here
      expect(response.body.message).toContain('Validation failed (numeric string is expected)');
    });

    // it('should handle errors gracefully', async () => {
    //   // Mock the service method to throw an error
    //   jest
    //     .spyOn(app.get(DeviceService), 'findAll')
    //     .mockRejectedValueOnce(new Error('Test error'));

    //   const response = await request(app.getHttpServer())
    //     .get('/devices')
    //     .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    //   // Add assertions for the response here
    //   expect(response.body.message).toBe('Internal server error');
    // });
  });
});
