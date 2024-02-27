import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UserResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: '652f70eff9c12a76d1b46b22',
  })
  id: string;

  @ApiProperty({
    description: 'Email of the user',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Username of the user',
    example: 'john_doe',
  })
  username: string;

  @ApiProperty({
    description: 'first name of the user',
    example: 'john',
  })
  fname: string;

  @ApiProperty({
    description: 'last name of the user',
    example: 'doe',
  })
  lname: string;
  @ApiProperty({
    description: 'profileUrl of the user',
    example: '....',
  })
  profileUrl?: string;
  @ApiProperty({
    description: 'isActive of the user',
    example: 'true',
  })
  isActive?: boolean;
  @ApiProperty({
    description: 'createdAt of the user',
    example: '....',
  })
  createdAt?: string;
}
export class BodyUserLoginDto {
  @ApiProperty({
    description: 'Username of the user',
    example: 'johndoe',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches('^[a-zA-Z0-9\\s]+$', undefined)
  username: string;

  @ApiProperty({
    description: 'Password of the user',
    example: 'Password123',
  })
  @IsNotEmpty()
  @Length(8)
  password: string;
}
export class AccessTokenResponseDto {
  @ApiProperty({
    description: 'sub  , roles , username',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NTJjYjliOTdkMDMxZGY5ODhiNDQ0OWQiLCJ1c2VybmFtZSI6InVzZXIxIiwicm9sZXMiOlsiQURNSU4iLCJVU0VSIl0sImlhdCI6MTY5NzYwNTQ1OCwiZXhwIjoxNjk4MTIzODU4fQ.hYwDpaFwBBrprOIy5q2aBvnsVyadQZXI8xXZJMpXKrw',
  })
  access_token: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @Length(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  @ApiProperty({
    description: 'new password of the user',
    example: 'NewPassword123',
  })
  newPassword: string;
}
