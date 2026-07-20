import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    // Register the User entity so TypeORM makes its repository available
    TypeOrmModule.forFeature([User]),
  ],
  providers: [UsersRepository, UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
