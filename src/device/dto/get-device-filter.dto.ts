import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class GetDevicesFilterDto {
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
