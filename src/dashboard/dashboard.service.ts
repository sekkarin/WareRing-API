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

@Injectable()
export class DashboardService {
  constructor(
    @Inject('DASHBOARD_MODEL')
    private readonly dashboardModel: Model<Dashboard>,
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

  async findAll(userID: string) {
    const dashboards = await this.dashboardModel
      .find({ userID })
      .populate('widgets');
    const dashboardResponse = dashboards.map((dashboard) =>
      this.mapToDashboardResponseDto(dashboard),
    );
    return dashboardResponse;
  }

  async addWidget(dashboardId: string, widgetId: string) {
    try {
      const widgetDuplicates = await this.dashboardModel.find({
        widgets: widgetId,
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
      .populate('widgets');
    if (!dashboard) {
      throw new NotFoundException('Dashboard not found');
    }
    return this.mapToDashboardResponseDto(dashboard);
  }

  update(id: number, updateDashboardDto: UpdateDashboardDto) {
    return `This action updates a #${id} dashboard`;
  }

  remove(id: number) {
    return `This action removes a #${id} dashboard`;
  }

  async deleteWidget(dashboardId: string, widgetId: string, userID: string) {
    try {
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
      return dashboard;
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
      widgets: dashboard.widgets,
      nameDashboard: dashboard.nameDashboard,
      description: dashboard.description,
      createdAt: dashboard.createdAt,
    };
  }
}
