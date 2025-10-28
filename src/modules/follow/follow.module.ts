import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from './entities/follow.entity';
import { Usuario } from '../user/entities/user.entity';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Follow, Usuario])],
  controllers: [FollowController],
  providers: [FollowService],
})
export class FollowModule {}
