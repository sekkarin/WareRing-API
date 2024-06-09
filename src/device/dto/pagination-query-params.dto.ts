import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PaginationQueryparamsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  // @Max(100)
  readonly limit?: number = 10;

  @Type(() => String)
  @IsString()
  @IsOptional()
  @IsEnum(['+createdAt', '-createdAt'])
  readonly createdAt?: string;

  @Type(() => String)
  @IsString()
  @IsOptional()
  readonly query?: string;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  readonly isSaveData?: boolean;

  @Type(() => String)
  @IsString()
  @IsOptional()
  @IsEnum(['allow', 'deny'])
  readonly permission?: string;
}
