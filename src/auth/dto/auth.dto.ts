import { ApiProperty } from '@nestjs/swagger';


export class UserResponseDto {
  @ApiProperty({
    description: 'Email of the user',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Role of the user',
    example: { User: 'USER' },
  })
  role: {
    User: string;
  };

  @ApiProperty({
    description: 'Username of the user',
    example: 'john_doe',
  })
  username: string;

  @ApiProperty({
    description: 'first name of the user',
    example: 'john',
  })
  nameTitle: string;

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
    description: 'Flag indicating whether the user is alive or not',
    example: true,
  })
  isAlive: boolean;

  @ApiProperty({
    description: "URL for the user's profile picture",
    example: 'https://example.com/profile.jpg',
  })
  profileUrl: string;

  @ApiProperty({
    description: 'Unique identifier of the user',
    example: '652f70eff9c12a76d1b46b22',
  })
  _id: string;
}
export class BodyUserLoginDto {
  @ApiProperty({
    description: 'Username of the user',
    example: 'john_doe',
  })
  username: string;
  @ApiProperty({
    description: 'Password of the user',
    example: 'password123',
  })
  readonly password: string;
}
export class AccessTokenResponseDto {
  @ApiProperty({
    description: 'sub  , roles , username',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NTJjYjliOTdkMDMxZGY5ODhiNDQ0OWQiLCJ1c2VybmFtZSI6InVzZXIxIiwicm9sZXMiOlsiQURNSU4iLCJVU0VSIl0sImlhdCI6MTY5NzYwNTQ1OCwiZXhwIjoxNjk4MTIzODU4fQ.hYwDpaFwBBrprOIy5q2aBvnsVyadQZXI8xXZJMpXKrw',
  })
  access_token: string;
}
