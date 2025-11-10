import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';
import { Comment } from '../comment/entities/comment.entity';
import { User } from '../user/entities/user.entity';
import { PostDislike } from './entities/post-dislike.entity';
import { PostView } from './entities/post-view.entity';
import { Report } from '../report/entities/report.entity';
import { SubscriptionModule } from '../subscription/subscription.module';
import { NotificationModule } from '../notifications/socket/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      PostLike,
      User,
      Comment,
      PostDislike,
      PostView,
      Report,
    ]),
    forwardRef(() => SubscriptionModule), // Para usar el guard de límite de posts
    NotificationModule,
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
