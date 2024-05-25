import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { userProviders } from './provider/user.providers';
import { DatabaseModule } from './../database/database.module';
import { deviceProviders } from './../device/provider/provider';
import { ManageFileS3Service } from 'src/utils/services/up-load-file-s3/up-load-file-s3.service';

@Module({
  providers: [
    UsersService,
    ManageFileS3Service,
    ...userProviders,
    ...deviceProviders,
  ],
  exports: [UsersService, ...userProviders],
  imports: [DatabaseModule],
  controllers: [UsersController],
})
export class UsersModule {}
