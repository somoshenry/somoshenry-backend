import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Post } from '../../post/entities/post.entity';
import { Comment } from '../../comment/entities/comment.entity';
import { Report, ReportStatus } from '../../report/entities/report.entity';
import { PostView } from '../../post/entities/post-view.entity';
import { PostLike } from '../../post/entities/post-like.entity';
import { PostDislike } from '../../post/entities/post-dislike.entity';
import type { AdminStatsDTO } from './dto/get-stats.dto';

interface RawReportedPost {
  id: string;
  content: string;
  createdAt: Date;
  userId: string;
  username: string;
  name: string;
  reportsCount: string;
  lastReportAt: string;
}

interface RawReportedComment {
  commentId: string;
  content: string;
  authorId: string;
  authorName: string;
  reportsCount: string;
  lastReportAt: string;
}

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Post) private readonly postRepo: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Report) private readonly reportRepo: Repository<Report>,
    @InjectRepository(PostView) private readonly viewRepo: Repository<PostView>,
    @InjectRepository(PostLike) private readonly likeRepo: Repository<PostLike>,
    @InjectRepository(PostDislike)
    private readonly dislikeRepo: Repository<PostDislike>,
  ) {}

  async getStats(): Promise<AdminStatsDTO> {
    const now = new Date();
    const d30 = new Date(now);
    d30.setDate(now.getDate() - 30);

    const [
      usersTotal,
      postsTotal,
      commentsTotal,
      postsFlagged,
      likesTotal,
      dislikesTotal,
      viewsTotalRow,
      reportedPostPendings,
      reportedCommentPendings,
      activeUsersDistinct,
    ] = await Promise.all([
      this.userRepo.count(),
      this.postRepo.count(),
      this.commentRepo.count(),
      this.postRepo.count({ where: { isInappropriate: true } }),
      this.likeRepo.count(),
      this.dislikeRepo.count(),
      this.postRepo
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.viewsCount), 0)', 'sum')
        .getRawOne<{ sum: string }>(),
      this.reportRepo
        .createQueryBuilder('r')
        .select('COUNT(*)', 'count')
        .where('r.status = :status', { status: ReportStatus.PENDING })
        .andWhere('r.postId IS NOT NULL')
        .getRawOne<{ count: string }>(),
      this.reportRepo
        .createQueryBuilder('r')
        .select('COUNT(*)', 'count')
        .where('r.status = :status', { status: ReportStatus.PENDING })
        .andWhere('r.commentId IS NOT NULL')
        .getRawOne<{ count: string }>(),
      this.viewRepo
        .createQueryBuilder('v')
        .select('COUNT(DISTINCT v.userId)', 'count')
        .where('v.viewedAt BETWEEN :d30 AND :now', { d30, now })
        .getRawOne<{ count: string }>(),
    ]);

    const usersActive30d = Number(activeUsersDistinct?.count ?? 0);
    const viewsTotal = Number(viewsTotalRow?.sum ?? 0);
    const postsReportedPending = Number(reportedPostPendings?.count ?? 0);
    const commentsReportedPending = Number(reportedCommentPendings?.count ?? 0);

    return {
      usersTotal,
      usersActive30d,
      postsTotal,
      commentsTotal,
      postsReportedPending,
      commentsReportedPending,
      postsFlagged,
      likesTotal,
      dislikesTotal,
      viewsTotal,
      trend: { users: -1, posts: -1, comments: -1 },
    };
  }

  async getReportedPosts(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const results = await this.reportRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.post', 'post')
      .leftJoinAndSelect('post.user', 'user')
      .select([
        'post.id AS id',
        'post.content AS content',
        'post.createdAt AS createdAt',
        'user.id AS userId',
        'user.username AS username',
        'user.name AS name',
        'COUNT(r.id) AS reportsCount',
        'MAX(r.createdAt) AS lastReportAt',
      ])
      .where('r.status = :status', { status: ReportStatus.PENDING })
      .andWhere('r.postId IS NOT NULL')
      .groupBy('post.id')
      .addGroupBy('user.id')
      .orderBy('reportsCount', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany<RawReportedPost>();

    const total = results.length;
    const totalPages = Math.ceil(total / limit);

    const data = results.map((r) => ({
      postId: r.id,
      content: r.content,
      author: {
        id: r.userId,
        username: r.username,
        name: r.name,
      },
      reportsCount: Number(r.reportsCount ?? 0),
      lastReportAt: r.lastReportAt ? new Date(r.lastReportAt) : null,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getReportedComments(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const results = await this.reportRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.comment', 'comment')
      .leftJoinAndSelect('comment.author', 'user')
      .where('r.status = :status', { status: ReportStatus.PENDING })
      .andWhere('r.commentId IS NOT NULL')
      .select([
        'comment.id AS commentId',
        'comment.content AS content',
        'user.id AS authorId',
        'user.name AS authorName',
        'COUNT(r.id) AS reportsCount',
        'MAX(r.createdAt) AS lastReportAt',
      ])
      .groupBy('comment.id')
      .addGroupBy('user.id')
      .orderBy('reportsCount', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany<RawReportedComment>();

    const total = results.length;
    const totalPages = Math.ceil(total / limit);

    const data = results.map((row) => ({
      commentId: row.commentId,
      content: row.content,
      author: {
        id: row.authorId,
        name: row.authorName,
      },
      reportsCount: Number(row.reportsCount ?? 0),
      lastReportAt: row.lastReportAt ? new Date(row.lastReportAt) : null,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
