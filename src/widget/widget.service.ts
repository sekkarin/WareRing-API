import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';

import { CreateWidgetDto } from './dto/create-widget.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';
import { Widget } from './interface/widget.interface';
import { WidgetResponseDto } from './dto/response-widget.dto';
import { PaginatedDto } from './../utils/dto/paginated.dto';

@Injectable()
export class WidgetService {
  constructor(
    @Inject('WIDGET_MODEL')
    private widgetModel: Model<Widget>, // private mongdb:Types
  ) {}
  async create(
    createWidgetDto: CreateWidgetDto,
    userID: string,
  ): Promise<WidgetResponseDto> {
    const createdWidget = new this.widgetModel({
      ...createWidgetDto,
      userID: userID,
    });
    await createdWidget.save();
    return this.mapToWidgetResponseDto(createdWidget);
  }

  async findAll(userId: string) {
    const widgets = await this.widgetModel.find({ userID: userId });

    const widgetResponse = widgets.map((widget) =>
      this.mapToWidgetResponseDto(widget),
    );
    return widgetResponse;
  }

  async findOne(id: string, userId: string): Promise<WidgetResponseDto> {
    const widget = await this.widgetModel
      .findOne({ _id: id, userID: userId })
      .exec();
    if (!widget) {
      throw new NotFoundException('Widget not found');
    }
    return this.mapToWidgetResponseDto(widget);
  }

  async update(
    id: string,
    userID: string,
    updateWidgetDto: UpdateWidgetDto,
  ): Promise<WidgetResponseDto> {
    const existingWidget = await this.widgetModel
      .findOneAndUpdate(
        {
          _id: id,
          userID: userID,
        },
        updateWidgetDto,
        { new: true },
      )
      .exec();
    if (!existingWidget) {
      throw new NotFoundException('Widget not found');
    }
    return this.mapToWidgetResponseDto(existingWidget);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.widgetModel
      .deleteOne({ _id: id, userID: userId })
      .exec();
    return result.deletedCount > 0;
  }
  private mapToWidgetResponseDto(widget: Widget): WidgetResponseDto {
    return {
      id: widget.id,
      nameDevice: widget.nameDevice,
      type: widget.type,
      configWidget: widget.configWidget,
      userId: widget.userID,
      createdAt: widget.createdAt,
      updatedAt: widget.updatedAt,
    };
  }
}
