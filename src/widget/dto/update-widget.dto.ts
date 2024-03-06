import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateWidgetDto } from './create-widget.dto';

export class UpdateWidgetDto extends PartialType(CreateWidgetDto) {
  @ApiProperty({
    description: 'The name of the device associated with the widget',
    example: 'My Device',
  })
  nameDevice?: string;

  @ApiProperty({
    description: 'The type of the widget',
    example: 'Temperature',
  })
  type?: string;

  @ApiProperty({
    description: 'Configuration settings for the widget',
    example: { threshold: 30, unit: 'Celsius' },
  })
  configWidget?: Record<string, any>;
}
