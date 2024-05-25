import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Length, Matches } from 'class-validator';

export class ResetNewPasswordDTO {
  @ApiProperty({
    description: 'New password for the user',
    example: 'Password123',
  })
  @IsNotEmpty()
  @Length(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'PasswordNew too weak',
  })
  passwordNew: string;

  @ApiProperty({
    description: 'Old password for the user',
    example: 'Password123',
  })
  @IsNotEmpty()
  @Length(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'PasswordOld too weak',
  })
  passwordOld: string;
}
