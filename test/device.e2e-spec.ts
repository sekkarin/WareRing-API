import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as mongoose from 'mongoose';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';

import { AppModule } from '../src/app.module';
import { CreateDeviceDto } from 'src/device/dto/create-device.dto';
import { UpdateDeviceDto } from 'src/device/dto/update-device.dto';

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
    const collections = await mongooseConnection.db.collections();

    for (const collection of collections) {
      await collection.deleteMany({});
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

  describe('Post /devices ', () => {
    it('should create a new device successfully', async () => {
      const response = await createDevice(app, accessToken, createDeviceDto);
      const createdDevice = response.body;

      // Assert the response contains the created device details
      expect(createdDevice.nameDevice).toBe(createDeviceDto.nameDevice);
      expect(createdDevice.usernameDevice).toBe(createDeviceDto.usernameDevice);
    });

    it('should return 400 if device with usernameDevice already exists', async () => {
      await createDevice(app, accessToken, createDeviceDto);

      await request(app.getHttpServer())
        .post('/devices')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDeviceDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 if device with existing topics is created', async () => {
      const createExistingTopics = {
        nameDevice: 'TestDevice',
        usernameDevice: 'test_username1',
        password: 'password',
        description: 'Test device description',
        topics: 'test_topics',
        qos: 0,
        retain: true,
        isSaveData: true,
      };
      await createDevice(app, accessToken, createDeviceDto);
      await request(app.getHttpServer())
        .post('/devices')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createExistingTopics)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when creating device with invalid payload', async () => {
      const invalidPayload = {};

      const response = await request(app.getHttpServer())
        .post('/devices')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidPayload)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toContain('nameDevice should not be empty');
      expect(response.body.message).toContain('nameDevice must be a string');
      expect(response.body.message).toContain(
        'usernameDevice should not be empty',
      );
      expect(response.body.message).toContain(
        'usernameDevice must be a string',
      );
      expect(response.body.message).toContain('password should not be empty');
      expect(response.body.message).toContain('password must be a string');
      expect(response.body.message).toContain(
        'description should not be empty',
      );
      expect(response.body.message).toContain('description must be a string');
      expect(response.body.message).toContain('topics should not be empty');
      expect(response.body.message).toContain(
        'topics must be longer than or equal to 3 characters',
      );
      expect(response.body.message).toContain('topics must be a string');
      expect(response.body.message).toContain(
        'qos must be one of the following values: ',
      );
      expect(response.body.message).toContain('qos should not be empty');
      expect(response.body.message).toContain(
        'qos must be a number conforming to the specified constraints',
      );
      expect(response.body.message).toContain('retain should not be empty');
      expect(response.body.message).toContain('retain must be a boolean value');
      expect(response.body.message).toContain('isSaveData should not be empty');
      expect(response.body.message).toContain(
        'isSaveData must be a boolean value',
      );
    });
  });
  describe('GET /devices', () => {
    it('should return a paginated list of devices', async () => {
      await createDevice(app, accessToken, createDeviceDto);
      // Make a request to the endpoint with pagination query parameters
      const response = await request(app.getHttpServer())
        .get('/devices')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      // Assert that the response body contains the paginated list of devices
      expect(response.body).toBeDefined();
      expect(response.body.data).toBeDefined();
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.page).toBe(1); // Check the returned page number
      expect(response.body.metadata.limit).toBe(10); // Check the returned perPage number
      expect(response.body.data.length).toBeGreaterThan(0); // Ensure at least one device is returned
      // Add more assertions as needed
    });
    it('should return 400 if invalid pagination parameters are provided', async () => {
      const invalidPage = 'invalid'; // Invalid page parameter
      const invalidLimit = 'invalid'; // Invalid limit parameter

      const response = await request(app.getHttpServer())
        .get('/devices')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ page: invalidPage, limit: invalidLimit })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('page must be an integer number');
      expect(response.body.message).toContain(
        'limit must be an integer number',
      );
    });
    it('should return an empty array if no devices are found for pagination', async () => {
      const page = 20;
      const limit = 20;

      const response = await request(app.getHttpServer())
        .get('/devices')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ page, limit })
        .expect(HttpStatus.OK);

      expect(response.body).toBeDefined();
      expect(response.body.data).toBeDefined();
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.page).toBe(page.toString());
      expect(response.body.metadata.limit).toBe(limit.toString());
      expect(response.body.data.length).toBe(0); // Empty array for no devices
    });
  });
  describe('GET /devices/:id', () => {
    it('should return device details by ID', async () => {
      // Assuming you have a device ID available for testing
      const device = await createDevice(app, accessToken, createDeviceDto);

      const deviceId = device.body.id;

      // Make a request to get device details by ID
      const response = await request(app.getHttpServer())
        .get(`/devices/${deviceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      // Assert that the response contains the expected device details
      expect(response.body).toBeDefined();
      expect(response.body.id).toEqual(deviceId); // Assuming the response contains the device ID
      // Add more assertions based on your response structure and expected data
    });
    it('should return 404 if device ID is not found', async () => {
      const nonExistingId = new mongoose.Types.ObjectId();

      // Make a request to get device details by non-existing ID
      await request(app.getHttpServer())
        .get(`/devices/${nonExistingId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
    it('should return 400 if device ID is invalid', async () => {
      // Make a request to get device details by an invalid ID (e.g., wrong format)
      const invalidId = 'invalid_device_id';

      // Make a request to get device details by invalid ID
      await request(app.getHttpServer())
        .get(`/devices/${invalidId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
  describe('Delete /devices/:id', () => {
    it('should delete a device successfully', async () => {
      const device = await createDevice(app, accessToken, createDeviceDto);
      // Extract the device ID from the response
      const deviceId = device.body.id; // Assuming the response contains the ID of the created device

      // Make a request to delete the device
      const deleteDeviceResponse = await request(app.getHttpServer())
        .delete(`/devices/${deviceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      // Assert that the response contains the expected message
      expect(deleteDeviceResponse.body.message).toEqual(
        'device deleted successfully',
      );
    });

    it('should return 404 when trying to delete a non-existing device', async () => {
      // Try to delete a non-existing device
      const nonExistingDeviceId = new mongoose.Types.ObjectId();
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/devices/${nonExistingDeviceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);

      // Check if appropriate error message is returned
      expect(deleteResponse.body.message).toEqual('Device not found');
    });
    it('should return 400 if device ID is invalid', async () => {
      const invalidDeviceId = 'invalid-id';
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/devices/${invalidDeviceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.BAD_REQUEST);
      // Check if appropriate error message is returned
      expect(deleteResponse.body.message).toEqual('Invalid ObjectId format');
    });
  });
  describe('Put /device/permission/:id', () => {
    it('should set permission for a device', async () => {
      const device = await createDevice(app, accessToken, createDeviceDto);
      const deviceId = device.body.id;
      const permissionsDto = {
        permission: 'deny', // Set the desired permission
      };

      // Set permission for the device
      const setPermissionResponse = await request(app.getHttpServer())
        .put(`/devices/permission/${deviceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(permissionsDto)
        .expect(HttpStatus.OK);

      // Check if the permission is set successfully
      expect(setPermissionResponse.body.permission).toBe('deny'); // Adjust accordingly based on your DTO structure
    });
    it('should return 404 if device is not found', async () => {
      const nonExistentDeviceId = 'non-existent-id';
      const permissionsDto = {
        permission: 'allow',
      };

      // Attempt to set permission for a non-existent device
      await request(app.getHttpServer())
        .put(`/device/permission/${nonExistentDeviceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(permissionsDto)
        .expect(HttpStatus.NOT_FOUND);
    });
    it('should return 400 for invalid permission value', async () => {
      const device = await createDevice(app, accessToken, createDeviceDto);
      const deviceId = device.body.id;
      const invalidPermissionsDto = {
        permission: 'invalid_permission',
      };

      // Attempt to set permission with an invalid permission value
      await request(app.getHttpServer())
        .put(`/devices/permission/${deviceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidPermissionsDto)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
  describe('Put /device/store/:id', () => {
    it('should set store for a device', async () => {
      const device = await createDevice(app, accessToken, createDeviceDto);
      const deviceId = device.body.id;
      const storeDataDto = {
        storeData: false, // Set storeData to true or false as needed
      };

      // Set permission for the device
      const setStoreResponse = await request(app.getHttpServer())
        .put(`/devices/store/${deviceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(storeDataDto)
        .expect(HttpStatus.OK);

      // Check if the permission is set successfully
      expect(setStoreResponse.body.isSaveData).toBe(false); // Adjust accordingly based on your DTO structure
    });
    it('should return 400 if store data DTO is invalid', async () => {
      // Invalid store data DTO
      const invalidStoreDataDto = {
        // Populate invalid store data DTO with missing or invalid fields
      };

      // Attempt to update store data with invalid DTO
      await request(app.getHttpServer())
        .put(`/devices/store/123`) // Use an invalid device ID
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidStoreDataDto)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
  describe('PUT /devices/:id', () => {
    it('should update a device successfully', async () => {
      const deviceCreationResponse = await createDevice(
        app,
        accessToken,
        createDeviceDto,
      );
      const createdDeviceId = deviceCreationResponse.body.id;

      // Define the update payload
      const updatePayload: UpdateDeviceDto = {
        nameDevice: 'TestDevice',
        usernameDevice: 'test_username_1',
        password: 'password',
        description: 'Test device description',
        topics: 'test_topics_1',
        qos: 1,
        retain: false,
        isSaveData: false,
      };

      // Perform the update request
      const updateResponse = await request(app.getHttpServer())
        .put(`/devices/${createdDeviceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload);
      // Assert the response status code is 200 OK
      expect(updateResponse.status).toBe(200);
      // Assert the response body contains the updated device details
      expect(updateResponse.body).toHaveProperty('id', createdDeviceId);
      expect(updateResponse.body.qos).toBe(updatePayload.qos);
      expect(updateResponse.body.usernameDevice).toBe(
        updatePayload.usernameDevice,
      );
    });
    it('should update a device with invalid username and return 400', async () => {
      const deviceId = 'valid-device-id';
      const updatePayload = {
        usernameDevice: '@!invalidusername',
      };

      await request(app.getHttpServer())
        .put(`/devices/${deviceId}`)
        .send(updatePayload)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });
    it('should update a device with an existing username and return 400', async () => {
      const deviceId = 'valid-device-id';
      const updatePayload = {
        usernameDevice: 'existing-username',
      };

      await request(app.getHttpServer())
        .put(`/devices/${deviceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)
        .expect(HttpStatus.BAD_REQUEST);
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
