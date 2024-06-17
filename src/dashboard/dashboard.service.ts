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
import { Columns } from './schemas/dashboard.schema';

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

  async findAll(
    query = '',
    page = 1,
    limit = 10,
    createdAt: string,
    currentUserId: string,
  ) {
    try {
      let dashboardsQuery = this.dashboardModel.find({
        userID: currentUserId ,
        $or: [
          { nameDashboard: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ],
      });
      const itemCount = await this.dashboardModel.countDocuments({
        userID: currentUserId ,
        $or: [
          { nameDashboard: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ],
      });
      dashboardsQuery = this.getSort(createdAt, dashboardsQuery);
      const dashboards = await dashboardsQuery
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
  private getSort(getDevicesSortDto: string, devicesQuery: any) {
    if (getDevicesSortDto) {
      devicesQuery = devicesQuery.sort(getDevicesSortDto);
    } else {
      devicesQuery = devicesQuery.sort({ createdAt: -1 });
    }
    return devicesQuery;
  }

  async addWidget(dashboardId: string, widgetId: string) {
    try {
      // Find the widget by ID
      const widgetExists = await this.widgetModel.findById(widgetId);
      if (!widgetExists) {
        throw new NotFoundException('Widget not found');
      }
      const dashboardExists = await this.dashboardModel.findById(dashboardId);
      if (!dashboardExists) {
        throw new NotFoundException('Dashboard not found');
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
              widgets: [
                {
                  widget: widgetExists._id,
                  column: Columns.Column1,
                },
              ],
            },
          },
          { new: true },
        );

        return this.mapToDashboardResponseDto(addWidget);
      }

      // Check if the widget is already added to the dashboard
      const widgetDuplicate = addWidget.widgets.find(
        (value) => value.widget._id.toString() === widgetId,
      );

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
            widgets: {
              widget: widgetExists._id,
              column: Columns.Column1,
            },
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
      .populate('widgets.widget');
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
      const widgetExistingDashboard = await this.dashboardModel.findOne({
        _id: dashboardId,
        'widgets.widget': widgetId,
      });
      if (!widgetExistingDashboard) {
        throw new NotFoundException('widget not found in dashboard');
      }
      const dashboard = await this.dashboardModel
        .findOneAndUpdate(
          {
            _id: dashboardId,
            userID,
            devices: widgetExists.deviceId,
          },
          {
            $pull: { widgets: { widget: widgetId } }, // Remove the widget from the widgets array
          },
          {
            new: true,
          },
        )
        .populate('widgets.widget');

      if (!dashboard) {
        throw new NotFoundException('Dashboard not found');
      }

      const removeDevice = dashboard.widgets.some((widget) =>
        widget.widget.toString().includes(widgetExists.deviceId),
      );

      if (!removeDevice) {
        const filteredDevice = dashboard.devices.filter(
          (device) => device.toString() !== widgetExists.deviceId.toString(),
        );

        dashboard.devices = filteredDevice;
        await dashboard.save();
      }
      const populatedDashboard = await this.dashboardModel
        .findById(dashboard._id)
        .lean();
      return this.mapToDashboardResponseDto(populatedDashboard);
    } catch (error) {
      throw error;
    }
  }

  private mapToDashboardResponseDto(
    dashboard: Dashboard,
  ): DashboardResponseDto {
    return {
      id: dashboard._id,
      userID: dashboard.userID,
      nameDashboard: dashboard.nameDashboard,
      description: dashboard.description,
      devices: dashboard.devices,
      widgets: dashboard.widgets,
      createdAt: dashboard.createdAt,
    };
  }
}
