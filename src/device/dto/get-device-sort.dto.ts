import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class GetDevicesSortDto {
  @Type(() => String)
  @IsString()
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  readonly createdAt?: string;

  @Type(() => String)
  @IsString()
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  readonly nameDevice?: string;
}
