import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateWidgetDto } from './create-widget.dto';

export class UpdateWidgetDto extends PartialType(CreateWidgetDto) {
  @ApiProperty({
    description: 'The label of the device associated with the widget',
    example: 'My Device',
  })
  label?: string;

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
