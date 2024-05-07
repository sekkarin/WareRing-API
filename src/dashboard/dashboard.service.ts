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
        dashboards.length,
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
        'dashboardInfo.device': widgetExists.deviceId,
      });

      // If dashboard with the matching device is not found, create a new dashboardInfo
      if (!addWidget) {
        addWidget = await this.dashboardModel
          .findOneAndUpdate(
            { _id: dashboardId },
            {
              $push: {
                dashboardInfo: {
                  device: widgetExists.deviceId,
                  widgets: [widgetExists._id],
                },
              },
            },
            { new: true },
          )
          .populate('dashboardInfo.device')
          .populate('dashboardInfo.widgets');
        return addWidget;
      }

      // Check if the widget is already added to the dashboard
      const widgetDuplicate = addWidget.dashboardInfo.find((info) =>
        info.widgets.includes(widgetId),
      );
      if (widgetDuplicate) {
        throw new ConflictException('Widget already exists in the dashboard');
      }

      // Add the widget to the existing dashboardInfo
      const insertWidget = await this.dashboardModel
        .findOneAndUpdate(
          {
            _id: dashboardId,
            'dashboardInfo.device': widgetExists.deviceId,
          },
          {
            $push: {
              'dashboardInfo.$.widgets': widgetExists._id,
            },
          },
          { new: true },
        )
        .populate('dashboardInfo.device')
        .populate('dashboardInfo.widgets');

      if (!insertWidget) {
        throw new NotFoundException('Widget not found');
      }

      return insertWidget;
    } catch (error) {
      throw error;
    }
  }

  async findOne(userID: string, dashboardId: string) {
    const dashboard = await this.dashboardModel
      .findOne({ _id: dashboardId, userID })
      .populate('dashboardInfo.device')
      .populate('dashboardInfo.widgets');
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
      const dashboard = await this.dashboardModel.findOneAndUpdate(
        {
          _id: dashboardId,
          userID,
          'dashboardInfo.device': widgetExists.deviceId,
        },
        {
          $pull: { 'dashboardInfo.$.widgets': widgetId }, // Remove the widget from the widgets array
        },
        {
          new: true,
        },
      );

      if (!dashboard) {
        throw new NotFoundException('Dashboard not found');
      }
      const updatedDashboard = await this.dashboardModel.findOneAndUpdate(
        { _id: dashboardId },
        { $pull: { dashboardInfo: { widgets: { $size: 0 } } } },
        { new: true },
      );

      return this.mapToDashboardResponseDto(updatedDashboard);
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
      dashboardInfo: dashboard.dashboardInfo,
      createdAt: dashboard.createdAt,
    };
  }
}
