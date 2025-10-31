import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from './entities/follow.entity';
import { User } from '../user/entities/user.entity';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { AuthModule } from '../auth/auth.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Follow, User]),
    AuthModule.register(new ConfigService()),
  ],
  controllers: [FollowController],
  providers: [FollowService],
})
export class FollowModule {}
