import { ApiProperty } from '@nestjs/swagger';

export class WidgetResponseDto {
  @ApiProperty({ description: 'The unique identifier of the widget' })
  id: string;

  @ApiProperty({ description: 'The ID of the user associated with the widget' })
  userId: string;

  @ApiProperty({ description: 'The name of the device' })
  nameDevice: string;

  @ApiProperty({ description: 'The type of the widget' })
  type: string;

  @ApiProperty({ description: 'The configuration of the widget' })
  configWidget: Record<string, any>;

  @ApiProperty({ description: 'The creation timestamp of the widget' })
  createdAt: Date;

  @ApiProperty({ description: 'The last update timestamp of the widget' })
  updatedAt: Date;
}
