import { ApiProperty } from '@nestjs/swagger';

export class DashboardPositionDto {
  @ApiProperty({
    example: ['{userId}/topic/subscribe', '{userId}/topic/publish'],
    description: 'Topics associated with the device',
  })
  widgets: any[];
}
