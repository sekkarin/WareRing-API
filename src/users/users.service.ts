import {
  Body,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './interfaces/user.interface';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UserResponseDto } from 'src/auth/dto/auth.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject('USER_MODEL')
    private userModel: Model<User>,
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
  async getUserById(username: string): Promise<User | undefined> {
    return await this.userModel
      .findOne({ username: username })
      .select('-password -refreshToken -isAlive -role')
      .exec();
  }
  async getAll(): Promise<User[] | undefined> {
    return this.userModel
      .find()
      .select('-password -refreshToken -isAlive -role')
      .exec();
  }
  async findOneById(id: string): Promise<User | undefined> {
    return this.userModel.findById(id).exec();
  }
  async update(userUpdate: UpdateUserDto, id: string) {
    try {
      const updateUser = await this.userModel
        .findOneAndUpdate<UpdateUserDto>(
          { _id: id },
          { ...userUpdate },
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
    const user = await this.findOne(crateUserDto.username);
    if (user) {
      throw new UnauthorizedException('username or email has been used');
    }
    const createdUser = new this.userModel({
      ...crateUserDto,
      roles: ['user'],
      isActive: true,
    });
    await createdUser.save();

    const userResponse: UserResponseDto = {
      _id: createdUser._id,
      email: createdUser.email,
      username: createdUser.username,
      fname: createdUser.firstName,
      lname: createdUser.lastName,
    };

    return userResponse;
  }
  async deleteUser(id: string) {
    return await this.userModel.deleteOne({ _id: id });
  }

  async verifiredUserEmail(email: string) {
    return await this.userModel.findOneAndUpdate(
      { email },
      { verifired: true },
    );
  }

  async setNewPassword(email, newPassword) {
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
}
