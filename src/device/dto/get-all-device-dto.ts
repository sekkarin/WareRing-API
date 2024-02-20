import { ApiProperty } from '@nestjs/swagger';
import { DeviceResponseDto } from '../dto/response-device.dto';

export class DevicesResponseDto {
  @ApiProperty({ type: [DeviceResponseDto] })
  data: DeviceResponseDto[];

  @ApiProperty({
    type: 'object',
    properties: {
      page: { type: 'number' },
      perPages: { type: 'number' },
      itemCount: { type: 'number' },
      pageCount: { type: 'number' },
      hasPreviousPage: { type: 'boolean' },
      hasNextPage: { type: 'boolean' },
    },
  })
  metadata: {
    page: number;
    limit: number;
    itemCount: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}
