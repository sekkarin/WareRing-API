import {
  BadRequestException,
  Body,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as bcrypt from 'bcrypt';

import { User } from './interfaces/user.interface';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UserResponseDto } from './../auth/dto/auth.dto';
import { PaginatedDto } from './../utils/dto/paginated.dto';
import { Device } from './../device/interface/device.interface';
import { WinstonLoggerService } from 'src/logger/logger.service';
import { ManageFileS3Service } from 'src/utils/services/up-load-file-s3/up-load-file-s3.service';
import { ResetNewPasswordDTO } from './dto/reset-new-password.DTO';

@Injectable()
export class UsersService {
  constructor(
    @Inject('USER_MODEL')
    private userModel: Model<User>,
    @Inject('DEVICE_MODEL')
    private deviceModel: Model<Device>,
    private readonly manageFileS3Service: ManageFileS3Service,
    private readonly logger: WinstonLoggerService,
  ) {}

  async findOne(username: string) {
    return this.userModel.findOne({ username: username });
  }
  async findRefreshToken(token: string) {
    return this.userModel.findOne({ refreshToken: token }).exec();
  }
  async findOneToken(token: string) {
    return this.userModel.findOne({ refreshToken: token });
  }
  async findByEmail(email: string) {
    return this.userModel.findOne({ email: email }).exec();
  }
  async getUserByUserName(username: string) {
    return await this.userModel
      .findOne({
        where: {
          username: username,
        },
      })
      .exec();
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    return await this.userModel
      .findOne({ username: username })
      .select('-password -refreshToken -isAlive -role')
      .exec();
  }
  async getAll(page = 1, limit = 10, currentUserId: string) {
    const itemCount = await this.userModel.countDocuments({
      _id: { $ne: currentUserId },
    });
    const users = await this.userModel
      .find({ _id: { $ne: currentUserId } })
      .skip((page - 1) * limit)
      .limit(limit);

    const usersResponse = users.map((user) => this.mapToUserResponseDto(user));
    return new PaginatedDto<UserResponseDto>(
      usersResponse,
      page,
      limit,
      itemCount,
    );
  }
  async findOneById(id: string): Promise<UserResponseDto> {
    try {
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const userResponse = this.mapToUserResponseDto(user);
      return userResponse;
    } catch (error) {
      return error;
    }
  }
  async updateUser(userUpdate: UpdateUserDto, id: string, nameFile?: string) {
    let hashPassword: string | undefined = undefined;
    try {
      const user = await this.userModel.findOne({ _id: id });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (nameFile && user.profileUrl) {
        await this.manageFileS3Service.deleteImage(user.profileUrl);
      }

      if (userUpdate?.password) {
        hashPassword = await bcrypt.hash(userUpdate?.password, 10);
      }
      const updateUser = await this.userModel
        .findOneAndUpdate(
          { _id: id },
          { ...userUpdate, profileUrl: nameFile, password: hashPassword },
          { new: true },
        )
        .exec();
      const userResponse = this.mapToUserResponseDto(updateUser);
      this.logger.log(`user ${id} update information successfully`);
      return userResponse;
    } catch (error) {
      throw error;
    }
  }
  private deleteFile(path: string) {
    const filePath = './uploads/profiles/' + path;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  async createUser(
    @Body() crateUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    const usernameAlreadyExists = await this.findOne(crateUserDto.username);
    if (usernameAlreadyExists) {
      throw new UnauthorizedException('username has been used');
    }
    const emailAlreadyExists = await this.findByEmail(crateUserDto.email);
    if (emailAlreadyExists) {
      throw new UnauthorizedException('email has been used');
    }
    const createdUser = new this.userModel({
      ...crateUserDto,
      roles: ['user'],
      isActive: true,
    });
    await createdUser.save();

    const userResponse = this.mapToUserResponseDto(createdUser);

    return userResponse;
  }
  async deleteUser(id: string) {
    this.logger.log(`user ${id} delete account successfully`);
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user?.profileUrl) {
      const fullUrl = user.profileUrl.split('/profile/')[1];
      this.deleteFile(fullUrl);
    }
    return await this.userModel.deleteOne({ _id: id });
  }
  async verifiedUserEmail(email: string) {
    return await this.userModel.findOneAndUpdate(
      { email },
      { verifired: true },
    );
  }
  async setNewPassword(email: string, newPassword: string) {
    try {
      const updatedUser = await this.userModel.findOneAndUpdate(
        { email },
        { password: newPassword },
      );
      return updatedUser;
    } catch (err) {
      throw new UnauthorizedException();
    }
  }
  private mapToUserResponseDto(user: User): UserResponseDto {
    return {
      id: user._id,
      email: user.email,
      fname: user.firstName,
      lname: user.lastName,
      username: user.username,
      isActive: user.isActive,
      profileUrl: user.profileUrl,
      createdAt: user.createdAt,
    };
  }
  async setBanned(banned: boolean, id: string) {
    try {
      const findUser = await this.userModel.findById(id);
      if (!findUser) {
        throw new NotFoundException(`User not found`);
      }
      const updatedUser = await this.userModel.findOneAndUpdate(
        { _id: id },
        { isActive: banned },
      );
      return this.mapToUserResponseDto(updatedUser);
    } catch (error) {
      throw error;
    }
  }
  async searchUsers(
    query: string,
    page = 1,
    limit = 10,
    currentUserId: string,
  ) {
    const itemCount = await this.userModel.countDocuments({
      _id: { $ne: currentUserId },
    });
    const users = await this.userModel
      .find({
        _id: { $ne: currentUserId },
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
        ],
      })
      .skip((page - 1) * limit)
      .limit(limit);

    const usersResponse = users.map((user) => this.mapToUserResponseDto(user));
    return new PaginatedDto<UserResponseDto>(
      usersResponse,
      page,
      limit,
      itemCount,
    );
  }
  async deleteProfileImage(userId: string) {
    try {
      const userExist = await this.userModel.findById(userId);
      if (!userExist) {
        throw new NotFoundException('user not found');
      }
      if (!userExist.profileUrl) {
        throw new NotFoundException('profileUrl not set');
      }
      await this.manageFileS3Service.deleteImage(userExist.profileUrl);
      userExist.profileUrl = null;
      userExist.save();
      return this.mapToUserResponseDto(userExist);
    } catch (error) {
      throw error;
    }
  }
  async resetNewPassword(
    userId: string,
    { passwordNew, passwordOld }: ResetNewPasswordDTO,
  ) {
    try {
      const userExist = await this.userModel.findById(userId);
      if (!userExist) {
        throw new NotFoundException('user not found');
      }
      const isMath = await bcrypt.compare(passwordOld, userExist.password);
      if (!isMath) {
        throw new BadRequestException('Old password is incorrect');
      }
      const newHashPassword = await bcrypt.hash(passwordNew, 10);
      userExist.password = newHashPassword;
      await userExist.save();

      return { message: 'Password has been successfully reset' };
    } catch (error) {
      throw error;
    }
  }
}
