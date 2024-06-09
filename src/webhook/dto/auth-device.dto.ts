import { IsNotEmpty, IsString, Length } from 'class-validator';

export class AuthDeviceDto {
  @Length(1, 25)
  @IsString()
  @IsNotEmpty()
  username: string;

  @Length(1, 25)
  @IsString()
  @IsNotEmpty()
  password: string;

  @Length(1, 255)
  @IsString()
  @IsNotEmpty()
  clientId: string;
}
