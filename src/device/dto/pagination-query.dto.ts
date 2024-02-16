import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiProperty({ default: 1 })
  @IsInt()
  // @Min(1)
  page = 1;

  @ApiProperty({ default: 10 })
  @IsInt()
  // @Min(1)
  perPage = 10;
}
