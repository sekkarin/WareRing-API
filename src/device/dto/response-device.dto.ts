import { ApiProperty } from '@nestjs/swagger';

export class DeviceResponseDto {
  @ApiProperty({
    example: '65bb39d6ad5db33b26010137',
    description: 'Unique identifier for the device',
  })
  id: string;

  @ApiProperty({
    example: '65b7d979221220adb1f43c2b',
    description: 'User ID associated with the device',
  })
  userID: string;

  @ApiProperty({
    example: 'MyDevice',
    description: 'Name of the device',
  })
  nameDevice: string;

  @ApiProperty({
    example: 'device_username',
    description: 'Username associated with the device',
  })
  usernameDevice: string;
  @ApiProperty({
    example: 'password1234',
    description: 'Password associated with the device',
  })
  password: string;

  @ApiProperty({
    example: 'Smart home controller',
    description: 'Description of the device',
  })
  description: string;

  @ApiProperty({
    example: 'allow',
    description: 'Permission level for the device',
  })
  permission: string;

  @ApiProperty({
    example: ['{userId}/topic/subscribe', '{userId}/topic/publish'],
    description: 'Topics associated with the device',
  })
  topics: string[];

  @ApiProperty({
    example: 'publish',
    description: 'Action associated with the device',
  })
  action: string;

  @ApiProperty({
    example: 0,
    description: 'Quality of Service level for device communication',
  })
  qos: number;

  @ApiProperty({
    example: true,
    description: 'Flag indicating whether to retain messages for the device',
  })
  retain: boolean;

  @ApiProperty({
    example: true,
    description: 'Flag indicating whether to save data for the device',
  })
  isSaveData: boolean;

  @ApiProperty({
    example: '2024-02-01T06:27:34.882Z',
    description: 'Timestamp when the device was created',
  })
  createdAt: Date;
}
