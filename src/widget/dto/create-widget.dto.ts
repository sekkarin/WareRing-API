import { IsNotEmpty, IsString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWidgetDto {
  @ApiProperty({
    description: 'The label of the device associated with the widget',
    example: 'My Device',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({
    description: 'The type of the widget',
    example: 'Temperature',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'Configuration settings for the widget',
    example: { threshold: 30, unit: 'Celsius' },
    required: true,
  })
  @IsObject()
  @IsNotEmpty()
  configWidget: Record<string, any>;
}
