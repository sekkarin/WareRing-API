import { IsNotEmpty, IsString, Length } from 'class-validator';

export class AuthzDeviceDto {
  @Length(1, 25)
  @IsString()
  @IsNotEmpty()
  action: string;

  @Length(1, 100)
  @IsString()
  @IsNotEmpty()
  topic: string;

  @Length(1, 255)
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @Length(1, 25)
  @IsString()
  @IsNotEmpty()
  username: string;
}
