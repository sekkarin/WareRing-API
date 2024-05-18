import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';

import { CreateWidgetDto } from './dto/create-widget.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';
import { Widget } from './interface/widget.interface';
import { WidgetResponseDto } from './dto/response-widget.dto';
import { LoggerService } from 'src/logger/logger.service';

@Injectable()
export class WidgetService {
  private readonly logger = new LoggerService(WidgetService.name);
  constructor(
    @Inject('WIDGET_MODEL')
    private widgetModel: Model<Widget>,
  ) {}
  //TODO: check device exiting
  async create(
    createWidgetDto: CreateWidgetDto,
    deviceId: string,
  ): Promise<WidgetResponseDto> {
    const createdWidget = new this.widgetModel({
      ...createWidgetDto,
      deviceId,
    });
    await createdWidget.save();
    this.logger.log(`user create widget successfully deviceID: ${deviceId}`);
    return this.mapToWidgetResponseDto(createdWidget);
  }

  async findAll(deviceId: string) {
    const widgets = await this.widgetModel.find({ deviceId });
    const widgetResponse = widgets.map((widget) =>
      this.mapToWidgetResponseDto(widget),
    );
    return widgetResponse;
  }

  async findOne(widgetId: string): Promise<WidgetResponseDto> {
    const widget = await this.widgetModel.findOne({ _id: widgetId }).exec();
    if (!widget) {
      throw new NotFoundException('Widget not found');
    }
    return this.mapToWidgetResponseDto(widget);
  }

  async update(
    widgetId: string,
    updateWidgetDto: UpdateWidgetDto,
  ): Promise<WidgetResponseDto> {
    const existingWidget = await this.widgetModel
      .findOneAndUpdate(
        {
          _id: widgetId,
        },
        updateWidgetDto,
        { new: true },
      )
      .exec();
    if (!existingWidget) {
      throw new NotFoundException('Widget not found');
    }
    this.logger.log(`user update widget successfully deviceID: ${widgetId}`);
    return this.mapToWidgetResponseDto(existingWidget);
  }

  async delete(widgetId: string, deviceId: string) {
    try {
      const result = await this.widgetModel
        .findOneAndRemove({ _id: widgetId, deviceId:deviceId })
        .exec();

      if (!result) {
        throw new NotFoundException('Widget not found');
      }
      this.logger.log(`user delete widget successfully deviceID: ${widgetId}`);
      return result;
    } catch (error) {
      throw error;
    }
  }
  private mapToWidgetResponseDto(widget: Widget): WidgetResponseDto {
    return {
      id: widget.id,
      label: widget.label,
      type: widget.type,
      configWidget: widget.configWidget,
      deviceId: widget.deviceId,
      createdAt: widget.createdAt,
      updatedAt: widget.updatedAt,
    };
  }
}
