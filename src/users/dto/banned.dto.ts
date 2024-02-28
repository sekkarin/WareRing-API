import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsBoolean,
} from 'class-validator';
export class BannedDto {
  @ApiProperty({ description: 'The banned state of the user', type: Boolean })
  @IsBoolean()
  @IsNotEmpty()
  banned: boolean;
}