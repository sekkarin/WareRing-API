import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsBoolean } from 'class-validator';

export class StoreDataDto {
  @ApiProperty({
    description: 'Flag indicating whether to save data',
    default: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  @IsBoolean()
  storeData: boolean;
}
