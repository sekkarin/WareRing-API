import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { DeviceService } from './device.service';
import { WinstonLoggerService } from 'src/logger/logger.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { Device } from './interface/device.interface';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Document, Model } from 'mongoose';
import { DatabaseModule } from 'src/database/database.module';
import { GetDevicesFilterDto } from './dto/get-device-filter.dto';
import { PaginatedDto } from 'src/utils/dto/paginated.dto';

describe('DeviceService', () => {
  let deviceService: DeviceService;
  let deviceModel: Model<Device>;

  const mockDeviceModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    constructor: jest.fn().mockReturnValue({
      save: jest.fn(),
    }),
    create: jest.fn(),
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceService,
        {
          provide: 'DEVICE_MODEL',
          useValue: mockDeviceModel,
        },
      ],
    }).compile();

    deviceService = module.get<DeviceService>(DeviceService);
    deviceModel = module.get<Model<Device>>('DEVICE_MODEL');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should be defined', () => {
    expect(deviceService).toBeDefined();
  });
  describe('create', () => {
    it('should create a device successfully', async () => {
      const createDeviceDto: CreateDeviceDto = {
        usernameDevice: 'testDevice',
        password: 'password',
        topics: 'testTopic',
        isSaveData: true,
        nameDevice: 'testNameDevice',
        qos: 0,
        retain: true,
        description: 'testDescription',
      };

      const userID = 'testUser';
      const hashedPassword = await bcrypt.hash(createDeviceDto.password, 10);
      const newDevice = {
        ...createDeviceDto,
        password_hash: hashedPassword,
        password_law: createDeviceDto.password,
        userID,
        topics: [
          `${userID}/${createDeviceDto.topics}/publish`,
          `${userID}/${createDeviceDto.topics}/subscribe`,
        ],
        // save: jest.fn(),
      };

      jest.spyOn(deviceModel, 'findOne').mockResolvedValue(null);
      jest.spyOn(deviceModel, 'create').mockResolvedValue(newDevice as any);
      jest.spyOn(deviceModel, 'find').mockResolvedValue([]);
      jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce(hashedPassword as never);

      // mockDeviceModel.constructor.mockReturnValue(newDevice);

      const result = await deviceService.create(createDeviceDto, userID);

      expect(deviceModel.findOne).toHaveBeenCalledWith({
        usernameDevice: createDeviceDto.usernameDevice,
      });
      expect(deviceModel.find).toHaveBeenCalledWith({
        topics: {
          $in: [
            `${userID}/${createDeviceDto.topics}/publish`,
            `${userID}/${createDeviceDto.topics}/subscribe`,
          ],
        },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createDeviceDto.password, 10);

      expect(result).toEqual(
        expect.objectContaining({
          usernameDevice: createDeviceDto.usernameDevice,
          topics: [
            `${userID}/${createDeviceDto.topics}/publish`,
            `${userID}/${createDeviceDto.topics}/subscribe`,
          ],
        }),
      );
    });

    it('should throw BadRequestException if device already exists', async () => {
      const createDeviceDto: CreateDeviceDto = {
        usernameDevice: 'testDevice',
        password: 'password',
        topics: 'testTopic',
        isSaveData: true,
        nameDevice: 'testNameDevice',
        qos: 0,
        retain: true,
        description: 'testDescription',
      };
      const userID = 'testUser';

      jest.spyOn(deviceModel, 'findOne').mockResolvedValue({});

      await expect(
        deviceService.create(createDeviceDto, userID),
      ).rejects.toThrow(
        new BadRequestException(
          'Device with this usernameDevice already exists',
        ),
      );

      expect(deviceModel.findOne).toHaveBeenCalledWith({
        usernameDevice: createDeviceDto.usernameDevice,
      });
    });

    it('should throw BadRequestException if topics are already assigned to another device', async () => {
      const createDeviceDto: CreateDeviceDto = {
        usernameDevice: 'testDevice',
        password: 'password',
        topics: 'testTopic',
        isSaveData: true,
        nameDevice: 'testNameDevice',
        qos: 0,
        retain: true,
        description: 'testDescription',
      };
      const userID = 'testUser';

      jest.spyOn(deviceModel, 'findOne').mockResolvedValue(null);
      jest.spyOn(deviceModel, 'find').mockResolvedValue([{}]);

      await expect(
        deviceService.create(createDeviceDto, userID),
      ).rejects.toThrow(
        new BadRequestException('Topics already assigned to another device'),
      );

      expect(deviceModel.findOne).toHaveBeenCalledWith({
        usernameDevice: createDeviceDto.usernameDevice,
      });
      expect(deviceModel.find).toHaveBeenCalledWith({
        topics: {
          $in: [
            `${userID}/${createDeviceDto.topics}/publish`,
            `${userID}/${createDeviceDto.topics}/subscribe`,
          ],
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated devices successfully', async () => {
      const query = '';
      const page = 1;
      const limit = 10;
      const userID = 'testUser';
      const getDevicesSortDto = 'nameDevice';
      const getDevicesFilterDto: GetDevicesFilterDto = {};

      const mockDevices: object[] = [
        {
          nameDevice: 'Device1',
          usernameDevice: 'user1',
          description: 'desc1',
        },
        {
          nameDevice: 'Device2',
          usernameDevice: 'user2',
          description: 'desc2',
        },
      ];

      const itemCount = mockDevices.length;

      jest.spyOn(deviceModel, 'countDocuments').mockResolvedValue(itemCount);

      jest.spyOn(deviceModel, 'find').mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockDevices),
        ...jest.fn().mockReturnThis(),
      } as any);

      const result = await deviceService.findAll(
        query,
        page,
        limit,
        userID,
        getDevicesSortDto,
        getDevicesFilterDto,
      );

      // expect(deviceModel.countDocuments).toHaveBeenCalledWith({ userID });
      expect(deviceModel.find).toHaveBeenCalledWith({
        userID,
        $or: [
          { nameDevice: { $regex: query, $options: 'i' } },
          { usernameDevice: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ],
        ...{},
      });
      expect(result).toEqual(
        new PaginatedDto(
          mockDevices.map((device) => expect.objectContaining(device)),
          page,
          limit,
          itemCount,
        ),
      );
    });

    it('should throw error', async () => {
      const query = '';
      const page = 1;
      const limit = 10;
      const userID = 'testUser';
      const getDevicesSortDto = 'nameDevice';
      const getDevicesFilterDto: GetDevicesFilterDto = {};
      jest.spyOn(deviceModel, 'countDocuments').mockImplementation(() => {
        throw Error('error');
      });

      await expect(
        deviceService.findAll(
          query,
          page,
          limit,
          userID,
          getDevicesSortDto,
          getDevicesFilterDto,
        ),
      ).rejects.toThrow(Error);
    });

    // Additional test cases can be added here
  });
});
