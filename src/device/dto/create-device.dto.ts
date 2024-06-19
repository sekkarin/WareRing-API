// create-device.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsEnum,
  Length,
  IsOptional,
  Max,
} from 'class-validator';

export class CreateDeviceDto {
  @ApiProperty({
    example: 'MyDevice',
    description: 'Name of the device',
  })
  @Length(1, 25)
  @IsString()
  @IsNotEmpty()
  nameDevice: string;

  @ApiProperty({
    example: 'device_username',
    description: 'Username for device authentication',
  })
  @Length(1, 25)
  @IsString()
  @IsNotEmpty()
  usernameDevice: string;

  @ApiProperty({
    example: 'hashed_password',
    description: 'Hashed password for device authentication',
  })
  @Length(4)
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: 'Smart home controller',
    description: 'Description of the device',
  })
  @Max(255)
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'topic1',
    description: 'The device is subscribed to',
  })
  @IsString()
  @Length(1, 25)
  @IsNotEmpty()
  topics: string;

  @ApiProperty({
    example: 0,
    description: 'Quality of Service level for device communication',
  })
  @IsNumber()
  @IsNotEmpty()
  @IsEnum([0, 1, 2])
  qos: number;

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
