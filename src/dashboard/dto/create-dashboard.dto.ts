import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length,  Max } from 'class-validator';

export class CreateDashboardDto {
  @ApiProperty({
    description: 'Dashboard name',
    maxLength: 50,
    example: 'My Dashboard',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  nameDashboard: string;

  @ApiProperty({
    description: 'Description',
    maxLength: 255,
    example: 'This is a sample dashboard',
  })
  @IsString()
  @Length(0,255)
  @IsOptional()
  description?: string;
}
