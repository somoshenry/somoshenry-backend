import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { User } from '../../user/entities/user.entity';
import { Post } from '../../post/entities/post.entity';
import { Comment } from '../../comment/entities/comment.entity';
import { Report } from '../../report/entities/report.entity';
import { PostView } from '../../post/entities/post-view.entity';
import { PostLike } from '../../post/entities/post-like.entity';
import { PostDislike } from '../../post/entities/post-dislike.entity';
import { AdminAuditModule } from './audit/admin-audit.module.ts';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Post,
      Comment,
      Report,
      PostView,
      PostLike,
      PostDislike,
    ]),
    AdminAuditModule,
  ],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
