import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UpdateDeviceDto } from '../src/device/dto/update-device.dto'; // Update the path accordingly
import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';

describe('DeviceController (e2e)', () => {
  let app:INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  it('/devices/:id (PUT)', async () => {
    const deviceId = 'your_device_id';
    const updateDeviceDto: UpdateDeviceDto = {
      nameDevice: 'Updated Device Name',
      usernameDevice: 'UpdatedUsername',
      // Add other properties based on your UpdateDeviceDto structure
    };

    const response = await request(app.getHttpServer())
      .put(`/devices/${deviceId}`)
      .send(updateDeviceDto)
      .expect(200);

    // Verify the response structure based on your expected DTO
    expect(response.body).toHaveProperty('your_expected_property');
    // Add more assertions based on your requirements
  });

  afterEach(async () => {
    await app.close();
  });
});
