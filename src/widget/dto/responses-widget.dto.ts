import { ApiProperty } from '@nestjs/swagger';
import { WidgetResponseDto } from './response-widget.dto';

export class WidgetResponsesDto {
  @ApiProperty({ type: [WidgetResponseDto] })
  data: WidgetResponseDto[];

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
