import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateActiveApiKeyDto {
  @ApiProperty({
    example: true,
    description: 'Indicates whether the API key is active',
  })
  @IsBoolean()
  isActive: boolean;
}
