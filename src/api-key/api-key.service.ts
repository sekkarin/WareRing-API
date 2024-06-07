import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

import { randomBytes } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { APIKey } from './interface/api-key.interface';
import { ConfigService } from '@nestjs/config';
import { PaginatedDto } from 'src/utils/dto/paginated.dto';
import { UpdateActiveApiKeyDto } from './dto/update-active-api-key.dto';
@Injectable()
export class ApiKeyService {
  constructor(
    private readonly jwtService: JwtService,
    private configService: ConfigService,
    @Inject('API-KEY_MODEL') private readonly apiKeyModel: Model<APIKey>,
  ) {}
  async create(createApiKeyDto: CreateApiKeyDto) {
    const SECRET_API_KEY =
      this.configService.getOrThrow<string>('SECRET_API_KEY');
    try {
      const payload = { key: this.generateUniqueKey() };
      let token: string;
      if (!createApiKeyDto.expireInSeconds) {
        token = this.jwtService.sign(payload, {
          secret: SECRET_API_KEY,
        });
      } else {
        token = this.jwtService.sign(payload, {
          secret: SECRET_API_KEY,
          expiresIn: createApiKeyDto.expireInSeconds,
        });
      }
      await this.apiKeyModel.create({
        key: payload.key,
        name: createApiKeyDto.name,
        description: createApiKeyDto.description,
        active: true,
      });
      return { key: token };
    } catch (error) {
      throw error;
    }
  }

  async findAll(page = 1, limit = 10, getSortDto: string, query = '') {
    try {
      let apiKeysQuery = this.apiKeyModel.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ],
      });
      const itemCount = await this.apiKeyModel.countDocuments({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ],
      });

      apiKeysQuery = this.getSort(getSortDto, apiKeysQuery);
      const apiKeys = await apiKeysQuery.skip((page - 1) * limit).limit(limit);
      return new PaginatedDto<any>(apiKeys, page, limit, itemCount);
    } catch (error) {
      throw error;
    }
  }
  private getFilter(getFilterDto: any) {
    let options = {};

    getFilterDto = this.removeUndefined(getFilterDto);

    if (getFilterDto) {
      options = { ...getFilterDto };
    }
    return { options, getFilterDto };
  }
  private getSort(getDevicesSortDto: string, devicesQuery: any) {
    if (getDevicesSortDto) {
      devicesQuery = devicesQuery.sort(getDevicesSortDto);
    } else {
      devicesQuery = devicesQuery.sort({ createdAt: -1 });
    }
    return devicesQuery;
  }
  private removeUndefined<T>(obj: T): T {
    const newObj = {} as T;
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        newObj[key] = obj[key];
      }
    }
    return newObj;
  }
  findOne(id: string) {
    try {
      return this.apiKeyModel.findById(id);
    } catch (error) {
      throw error;
    }
  }

  remove(id: string) {
    try {
      return this.apiKeyModel.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  }
  async updateStatus(
    id: string,
    updateActiveApiKeyDto: UpdateActiveApiKeyDto,
  ): Promise<APIKey> {
    const apiKey = await this.apiKeyModel
      .findByIdAndUpdate(
        id,
        { active: updateActiveApiKeyDto.isActive },
        { new: true },
      )
      .exec();

    if (!apiKey) {
      throw new NotFoundException(`API Key with ID ${id} not found`);
    }

    return apiKey;
  }
  private generateUniqueKey(): string {
    return randomBytes(32).toString('hex');
  }
}
