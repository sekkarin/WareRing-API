import { ApiProperty } from '@nestjs/swagger';


export class User {
  @ApiProperty()
  id: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  password: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  role: {
    User: {
      default: string;
      type: string;
    };
    Admin: string;
  };
  @ApiProperty()
  username: string;
  @ApiProperty()
  isAlive: {
    type: number;
    default: boolean;
  };
  @ApiProperty()
  profileUrl: {
    type: string;
  };
  @ApiProperty()
  timestamps: string;
}
