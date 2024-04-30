import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { Model } from 'mongoose';
import { Dashboard } from './interfaces/dashboard.interface';
import { DashboardResponseDto } from './dto/dashboard-response';
import { Widget } from 'src/widget/interface/widget.interface';
import { PaginatedDto } from 'src/utils/dto/paginated.dto';

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

  async findAll(query= '', page = 1, limit = 10, currentUserId: string) {
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
        .limit(limit)
        .populate({
          path: 'widgets',
          populate: {
            path: 'deviceId',
            model: 'Device',
          },
        });
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
      const widgetExists = await this.widgetModel.findOne({ _id: widgetId });

      if (!widgetExists) {
        throw new NotFoundException('not found widget');
      }
      const widgetDuplicates = await this.dashboardModel.findOne({
        widgets: widgetId,
        _id: dashboardId,
      });

      if (widgetDuplicates) {
        throw new ConflictException('Widget already exists in the dashboard');
      }
      const dashboard = await this.dashboardModel.findOneAndUpdate(
        { _id: dashboardId },
        {
          $push: { widgets: widgetId },
        },
        {
          new: true,
        },
      );
      if (!dashboard) {
        throw new NotFoundException('Dashboard not found');
      }
      return this.mapToDashboardResponseDto(dashboard);
    } catch (error) {
      throw error;
    }
  }

  async findOne(userID: string, dashboardId: string) {
    const dashboard = await this.dashboardModel
      .findOne({ _id: dashboardId, userID })
      .populate({
        path: 'widgets',
        populate: {
          path: 'deviceId',
          model: 'Device',
        },
      });
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
    return `This action updates a #${id} dashboard`;
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
        },
        {
          $pull: { widgets: widgetId },
        },
        {
          new: true,
        },
      );

      if (!dashboard) {
        throw new NotFoundException('Dashboard not found');
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
      widgets: dashboard.widgets,
      createdAt: dashboard.createdAt,
    };
  }
}
