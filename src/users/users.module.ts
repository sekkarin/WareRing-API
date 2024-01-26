import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { userProviders } from './user.providers';
import { DatabaseModule } from 'src/database/database.module';


@Module({
  providers: [
    UsersService,
    ...userProviders,
  ],
  exports: [UsersService,...userProviders],
  imports: [DatabaseModule],
  controllers: [UsersController],
})
export class UsersModule {}
