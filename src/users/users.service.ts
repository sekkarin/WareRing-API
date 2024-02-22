// endpoint upload profile
import {
  Body,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';

import { User } from './interfaces/user.interface';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UserResponseDto } from 'src/auth/dto/auth.dto';
import { PaginatedDto } from 'src/utils/dto/paginated.dto';
import { Device } from 'src/device/interface/device.interface';

@Injectable()
export class UsersService {
  constructor(
    @Inject('USER_MODEL')
    private userModel: Model<User>,
    @Inject('DEVICE_MODEL')
    private deviceModel: Model<Device>,
  ) {}

  async findOne(username: string) {
    return this.userModel.findOne({ username: username }).exec();
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
  async update(
    userUpdate: UpdateUserDto,
    id: string,
    file: Express.Multer.File | undefined,
    url: string,
  ) {
    let profileUrl: string | undefined = undefined;
    try {
      if (file.filename) {
        // delete file
        // new file
        profileUrl = url + file.filename;
      }
      const updateUser = await this.userModel
        .findOneAndUpdate<UpdateUserDto>(
          { _id: id },
          { ...userUpdate, profileUrl },
          { new: true },
        )
        .select('-password -refreshToken -role')
        .exec();

      return updateUser;
    } catch (error) {
      throw new UnauthorizedException();
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
    await this.deviceModel.deleteMany({ userID: id });
    return await this.userModel.deleteOne({ _id: id });
  }

  async verifiredUserEmail(email: string) {
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
      id: user.id,
      email: user.email,
      fname: user.firstName,
      lname: user.lastName,
      username: user.username,
      profileUrl: user.profileUrl,
      createdAt: user.createdAt,
    };
  }
}
