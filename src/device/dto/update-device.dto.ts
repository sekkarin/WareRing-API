import { PartialType } from '@nestjs/swagger';
import { CreateDeviceDto } from './create-device.dto';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
export class UpdateDeviceDto extends PartialType(CreateDeviceDto) {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nameDevice?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  usernameDevice?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  permission?: string;

  @IsOptional()
  @IsArray()
  @IsNotEmpty()
  topics?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  action?: string;

  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
  qos?: number;

  @IsOptional()
  @IsBoolean()
  @IsNotEmpty()
  retain?: boolean;

  @IsOptional()
  @IsBoolean()
  @IsNotEmpty()
  isSaveData?: boolean;
}
