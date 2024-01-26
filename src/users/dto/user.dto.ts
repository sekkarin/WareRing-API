import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  Length,
  Matches
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email of the user',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Password for the user',
    example: 'password123',
  })
  @IsNotEmpty()
  @Length(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {message: 'password too weak'})
  password: string;

  @ApiProperty({
    description: 'Phone of the user',
    example: '0800000000',
  })
  @IsString()
  @Length(10, 10)
  phone: string;

  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
  })
  @IsString()
  @Length(3, 30)
  fname: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
  })
  @IsNotEmpty()
  @IsString()
  @Length(3, 30)
  lname: string;

  @ApiProperty({
    description: 'Role of the user',
    example: { User: 'USER', Admin: 'ADMIN' },
  })
  role: {
    User: string;
    Admin: string;
  };

  @ApiProperty({
    description: 'Username of the user',
    example: 'john_doe',
  })
  @IsNotEmpty()
  @IsString()
  @Length(5, 30)
  username: string;

  @ApiProperty({
    description: 'Title or salutation of the user',
    example: 'Mr',
  })
  @IsNotEmpty()
  @IsString()
  nameTitle: string;

  @ApiProperty({
    description: 'Flag indicating whether the user is alive or not',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isAlive?: boolean;

  @ApiProperty({
    description: "URL for the user's profile picture",
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  profileUrl?: string;
}

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fname?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lname?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  role?: {
    User?: string;
    Admin?: string;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nameTitle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isAlive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  profileUrl?: string;
}

export class User {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: '1234567890',
  })
  readonly id?: string;
  @ApiProperty({
    description: 'Email of the user',
    example: 'user@example.com',
  })
  readonly email: string;

  @ApiProperty({
    description: 'Password of the user',
    example: 'password123',
  })
  readonly password: string;

  @ApiProperty({
    description: 'Name of the user',
    example: 'John Doe',
  })
  readonly name: string;

  @ApiProperty({
    description: 'Role of the user (User or Admin)',
    example: 'User',
    enum: ['User', 'Admin'],
  })
  readonly role?: {
    User: string;
    Admin: string;
  };

  @ApiProperty({
    description: 'Username of the user',
    example: 'john_doe',
  })
  readonly username: string;

  @ApiProperty({
    description: 'Flag indicating whether the user is alive or not',
    example: 'true',
  })
  readonly isAlive: string;

  @ApiProperty({
    description: "URL for the user's profile picture",
    example: 'https://example.com/profile.jpg',
  })
  readonly profileUrl: string;
}
export class GetUserAllDto {
  @ApiProperty({
    description: 'Role of the user',
    example: { User: 'USER' },
  })
  role: {
    User: string;
  };

  @ApiProperty({
    description: 'Unique identifier of the user',
    example: '652f749b1e4adf0bc1e322bf',
  })
  _id: string;

  @ApiProperty({
    description: 'Email of the user',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Name of the user',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Username of the user',
    example: 'john_doe',
  })
  username: string;

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
    description: 'Date and time of user creation',
    example: '2023-10-18T06:00:59.881Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Date and time of last update',
    example: '2023-10-18T06:00:59.881Z',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'Version of the document',
    example: 0,
  })
  __v: number;
}
