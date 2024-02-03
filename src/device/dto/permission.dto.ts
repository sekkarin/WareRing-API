import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '../types/permission.type';
import { IsString, IsNotEmpty,IsEnum } from 'class-validator';

export class PermissionsDto {
  @ApiProperty({
    description: 'Permission type (allow or deny)',
    enum: ['allow', 'deny'],
    default: 'allow',
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(["deny", "allow"])
  permission: Permission;
}
