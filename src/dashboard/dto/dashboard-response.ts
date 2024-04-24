import { ApiProperty } from "@nestjs/swagger";

export class DashboardResponseDto {
  @ApiProperty({
    example: '65bb39d6ad5db33b26010137',
    description: 'Unique identifier for the device',
  })
  id: string;

  @ApiProperty({
    example: '65b7d979221220adb1f43c2b',
    description: 'User ID associated with the device',
  })
  userID?: string;

  @ApiProperty({
    example: 'MyDevice',
    description: 'Name of the device',
  })
  nameDashboard: string;

  @ApiProperty({
    example: 'Smart home controller',
    description: 'Description of the device',
  })
  description: string;

  @ApiProperty({
    example: ['{userId}/topic/subscribe', '{userId}/topic/publish'],
    description: 'Topics associated with the device',
  })
  widgets: string[];

  @ApiProperty({
    example: '2024-02-01T06:27:34.882Z',
    description: 'Timestamp when the device was created',
  })
  createdAt: Date;
}