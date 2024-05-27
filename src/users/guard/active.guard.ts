import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from '../interfaces/user.interface';

@Injectable()
export class IsActivateUser implements CanActivate {
  constructor(
    @Inject('USER_MODEL')
    private userModel: Model<User>,
  ) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const userId = request['user'].sub;
    const isUserActive = await this.userModel.findOne({ _id: userId });
    if (!isUserActive) {
      throw new NotFoundException('User not found verify activate');
    }
    return isUserActive.isActive;
  }
}
