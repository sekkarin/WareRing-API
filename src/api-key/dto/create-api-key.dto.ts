import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({
    example: 'Description about the API key',
    description: 'A brief description of what the API key is used for',
  })
  @IsString()
  @MaxLength(255)
  description: string;
  @ApiProperty({
    example: 'Description about the API key',
    description: 'A brief description of what the API key is used for',
  })
  @IsString()
  @MaxLength(30)
  name: string;

  @ApiProperty({
    example: 3600,
    description: 'Expiration time in seconds (optional)',
  })
  @IsNumber()
  @IsOptional()
  expireInSeconds?: number;
}
