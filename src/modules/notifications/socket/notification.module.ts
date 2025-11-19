import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { Notification } from './entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationListeners } from './notification.listeners';
import { NotificationGateway } from './notification.gateway';

import { User } from '../../user/entities/user.entity';
import { Post } from '../../post/entities/post.entity';
import { Comment } from '../../comment/entities/comment.entity';

import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User, Post, Comment]),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway, NotificationListeners],
  exports: [NotificationService],
})
export class NotificationModule {}
