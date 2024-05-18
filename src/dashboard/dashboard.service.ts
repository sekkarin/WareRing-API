import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';

import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { Dashboard } from './interfaces/dashboard.interface';
import { DashboardResponseDto } from './dto/dashboard-response';

import { PaginatedDto } from 'src/utils/dto/paginated.dto';
import { Widget } from 'src/widget/interface/widget.interface';
import { DashboardPositionDto } from './dto/position-dashboarrd.dto';

@Injectable()
export class DashboardService {
  constructor(
    @Inject('DASHBOARD_MODEL')
    private readonly dashboardModel: Model<Dashboard>,
    @Inject('WIDGET_MODEL') private readonly widgetModel: Model<Widget>,
  ) {}
  async create(createDashboardDto: CreateDashboardDto, userID: string) {
    try {
      const createDashboard = await this.dashboardModel.create({
        userID,
        ...createDashboardDto,
      });
      return this.mapToDashboardResponseDto(createDashboard);
    } catch (error) {
      throw error;
    }
  }

  async findAll(query = '', page = 1, limit = 10, currentUserId: string) {
    try {
      const itemCount = await this.dashboardModel.countDocuments({
        userID: currentUserId,
      });
      const dashboards = await this.dashboardModel
        .find({
          _id: { $ne: currentUserId },
          $or: [
            { nameDashboard: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
          ],
        })
        .skip((page - 1) * limit)
        .limit(limit);
      const dashboardResponse = dashboards.map((dashboard) =>
        this.mapToDashboardResponseDto(dashboard),
      );
      return new PaginatedDto<DashboardResponseDto>(
        dashboardResponse,
        page,
        limit,
        itemCount,
      );
    } catch (error) {
      throw error;
    }
  }

  async addWidget(dashboardId: string, widgetId: string) {
    try {
      // Find the widget by ID
      const widgetExists = await this.widgetModel.findById(widgetId);
      if (!widgetExists) {
        throw new NotFoundException('Widget not found');
      }

      // Find the dashboard that matches the widget's device
      let addWidget = await this.dashboardModel.findOne({
        _id: dashboardId,
        devices: widgetExists.deviceId,
      });

      // If dashboard with the matching device is not found, create a new dashboardInfo
      if (!addWidget) {
        addWidget = await this.dashboardModel.findOneAndUpdate(
          { _id: dashboardId },
          {
            $push: {
              devices: [widgetExists.deviceId],
              widgets: [widgetExists._id],
            },
          },
          { new: true },
        );

        return this.mapToDashboardResponseDto(addWidget);
      }

      // Check if the widget is already added to the dashboard
      const widgetDuplicate = addWidget.widgets.includes(widgetId);
      if (widgetDuplicate) {
        throw new ConflictException('Widget already exists in the dashboard');
      }

      // Add the widget to the existing dashboardInfo
      const insertWidget = await this.dashboardModel.findOneAndUpdate(
        {
          _id: dashboardId,
          devices: widgetExists.deviceId,
        },
        {
          $push: {
            widgets: widgetExists._id,
          },
        },
        { new: true },
      );

      if (!insertWidget) {
        throw new NotFoundException('Widget not found');
      }

      return this.mapToDashboardResponseDto(insertWidget);
    } catch (error) {
      throw error;
    }
  }

  async findOne(userID: string, dashboardId: string) {
    const dashboard = await this.dashboardModel
      .findOne({ _id: dashboardId, userID })
      .populate('devices')
      .populate('widgets');
    if (!dashboard) {
      throw new NotFoundException('Dashboard not found');
    }
    return this.mapToDashboardResponseDto(dashboard);
  }

  async update(id: string, updateDashboardDto: UpdateDashboardDto) {
    try {
      const updatedDashboard = await this.dashboardModel.findByIdAndUpdate(
        id,
        updateDashboardDto,
        {
          new: true,
        },
      );
      if (!updatedDashboard) {
        throw new NotFoundException('Dashboard not found');
      }
      return this.mapToDashboardResponseDto(updatedDashboard);
    } catch (error) {
      throw error;
    }
  }
  async updatePosition(id: string, dashboardPositionDto: DashboardPositionDto) {
    try {
      const updatedDashboard = await this.dashboardModel.findByIdAndUpdate(
        id,
        {
          widgets: dashboardPositionDto.widgets,
        },
        {
          new: true,
        },
      );
      if (!updatedDashboard) {
        throw new NotFoundException('Dashboard not found');
      }
      return this.mapToDashboardResponseDto(updatedDashboard);
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const dashboard = await this.dashboardModel.findOneAndRemove({ _id: id });
      if (!dashboard) {
        throw new NotFoundException(`Dashboard ${id} not found`);
      }
      return {
        message: 'delete dashboard successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteWidget(dashboardId: string, widgetId: string, userID: string) {
    try {
      const widgetExists = await this.widgetModel.findOne({ _id: widgetId });
      if (!widgetExists) {
        throw new NotFoundException('not found widget');
      }
      const dashboard = await this.dashboardModel
        .findOneAndUpdate(
          {
            _id: dashboardId,
            userID,
            devices: widgetExists.deviceId,
          },
          {
            $pull: { widgets: widgetId }, // Remove the widget from the widgets array
          },
          {
            new: true,
          },
        )
        .populate('widgets');

      if (!dashboard) {
        throw new NotFoundException('Dashboard not found');
      }

      const removeDevice = dashboard.widgets.some((widget: Widget) =>
        widget.deviceId.toString().includes(widgetExists.deviceId),
      );

      if (!removeDevice) {
        const filteredDevice = dashboard.devices.filter(
          (device) => device.toString() !== widgetExists.deviceId.toString(),
        );

        dashboard.devices = filteredDevice;
        await dashboard.save();
      }
      return this.mapToDashboardResponseDto(dashboard);
    } catch (error) {
      throw error;
    }
  }

  private mapToDashboardResponseDto(
    dashboard: Dashboard,
  ): DashboardResponseDto {
    return {
      id: dashboard.id,
      userID: dashboard.userID,
      nameDashboard: dashboard.nameDashboard,
      description: dashboard.description,
      devices: dashboard.devices,
      widgets: dashboard.widgets,
      createdAt: dashboard.createdAt,
    };
  }
}
