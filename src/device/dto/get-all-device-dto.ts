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
    },
  })
  metadata: {
    page: number;
    perPages: number;
  };
}
