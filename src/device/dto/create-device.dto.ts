// create-device.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsArray,
  IsNumber,
  IsEnum,
} from 'class-validator';

export class CreateDeviceDto {
  @ApiProperty({
    example: 'MyDevice',
    description: 'Name of the device',
  })
  @IsString()
  @IsNotEmpty()
  nameDevice: string;

  @ApiProperty({
    example: 'device_username',
    description: 'Username for device authentication',
  })
  @IsString()
  @IsNotEmpty()
  usernameDevice: string;

  @ApiProperty({
    example: 'hashed_password',
    description: 'Hashed password for device authentication',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: 'Smart home controller',
    description: 'Description of the device',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: ['topic1', 'topic2'],
    description: 'List of topics the device is subscribed to',
  })
  @IsArray()
  @IsNotEmpty()
  topics: string[];

  @ApiProperty({
    example: 0,
    description: 'Quality of Service level for device communication',
  })
  @IsNumber()
  @IsNotEmpty()
  @IsEnum([0, 1, 2])
  qos: string;

  @ApiProperty({
    example: true,
    description: 'Whether the device retains messages',
  })
  @IsBoolean()
  @IsNotEmpty()
  retain: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether the device saves data',
  })
  @IsBoolean()
  @IsNotEmpty()
  isSaveData: boolean;
}
