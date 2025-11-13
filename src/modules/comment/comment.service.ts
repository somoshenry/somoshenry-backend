import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';
import { CommentLike } from './entities/comment-like.entity';
import { Post } from '../post/entities/post.entity';
import { User } from '../user/entities/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OpenAIService } from '../open-ai/openai.service';
import { ReportService } from '../report/report.service';
import { CreateReportDto } from '../report/dto/create-report.dto';
import { ReportReason } from '../report/entities/report.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(CommentLike)
    private readonly commentLikeRepository: Repository<CommentLike>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
    private readonly openAiService: OpenAIService,
    private readonly reportService: ReportService,
  ) {}

  async create(
    createCommentDto: CreateCommentDto & { postId: string },
    userId: string,
  ): Promise<Comment> {
    const { postId, parentId, content } = createCommentDto;

    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    let parentComment: Comment | null = null;
    if (parentId) {
      parentComment = await this.commentRepository.findOne({
        where: { id: parentId },
      });
      if (!parentComment)
        throw new NotFoundException('Parent comment not found');

      if (parentComment.postId !== postId) {
        throw new ForbiddenException('Parent comment belongs to another post');
      }
    }

    const isInappropriate = await this.openAiService.isInappropriate(content);

    const comment = this.commentRepository.create({
      postId,
      authorId: userId,
      parentId: parentComment?.id || null,
      content,
    });

    await this.commentRepository.save(comment);

    if (isInappropriate) {
      const createReportDto = new CreateReportDto();
      createReportDto.commentId = comment.id;
      createReportDto.reason = ReportReason.INAPPROPRIATE;
      await this.reportService.create(createReportDto, userId);
    }

    if (parentComment) {
      await this.commentRepository.increment(
        { id: parentComment.id },
        'replyCount',
        1,
      );
    }

    const sender = await this.userRepository.findOne({ where: { id: userId } });
    const receiver =
      parentComment && parentComment.authorId
        ? await this.userRepository.findOne({
            where: { id: parentComment.authorId },
          })
        : post.user;

    this.eventEmitter.emit('comment.created', {
      sender,
      receiver,
      comment,
      post,
    });

    return comment;
  }

  async findAll(postId?: string): Promise<Comment[]> {
    const query = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.likes', 'likes')
      .where('comment.isDeleted = :isDeleted', { isDeleted: false });

    if (postId) {
      query.andWhere('comment.postId = :postId', { postId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['author', 'likes'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
    userId: string,
    userRole: UserRole,
  ): Promise<Comment> {
    const comment = await this.findOne(id);

    if (comment.authorId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar este comentario',
      );
    }

    Object.assign(comment, updateCommentDto);
    return this.commentRepository.save(comment);
  }

  async remove(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<Comment> {
    const comment = await this.findOne(id);

    if (comment.authorId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar este comentario',
      );
    }

    comment.isDeleted = true;
    return this.commentRepository.save(comment);
  }

  async likeComment(
    commentId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const _comment = await this.findOne(commentId);
    const existingLike = await this.commentLikeRepository.findOne({
      where: { commentId, userId },
    });

    if (existingLike) {
      await this.commentLikeRepository.remove(existingLike);
      await this.commentRepository.decrement({ id: commentId }, 'likeCount', 1);
      return { message: 'Like removed' };
    }

    const like = this.commentLikeRepository.create({
      commentId,
      userId,
    });

    await this.commentLikeRepository.save(like);
    await this.commentRepository.increment({ id: commentId }, 'likeCount', 1);

    return { message: 'Comment liked' };
  }

  async getCommentThread(
    id: string,
    depth = 3,
    page = 1,
    limit = 10,
  ): Promise<Comment> {
    const root = await this.commentRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['author'],
    });
    if (!root) throw new NotFoundException('Comment not found');

    const all = await this.commentRepository.find({
      where: { postId: root.postId, isDeleted: false },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });

    const map = new Map<string, Comment & { children: Comment[] }>();
    all.forEach((c) => map.set(c.id, { ...c, children: [] }));

    for (const c of map.values()) {
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.children.push(c);
      }
    }

    const trimTree = (
      node: Comment & { children: Comment[] },
      level = 1,
    ): Comment => {
      if (level >= depth) {
        node.children = []; // cortar aquí
        return node;
      }

      const start = (page - 1) * limit;
      const end = start + limit;
      const paginated = node.children.slice(start, end);

      node.children = paginated.map((child) => trimTree(child, level + 1));
      return node;
    };

    const thread = map.get(root.id);
    if (!thread) throw new NotFoundException('Thread not found');

    return trimTree(thread);
  }

  async getCommentSummary(id: string, limit = 3): Promise<any> {
    const comment = await this.commentRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['author'],
    });

    if (!comment) throw new NotFoundException('Comment not found');

    const recentReplies = await this.commentRepository.find({
      where: { parentId: comment.id, isDeleted: false },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return {
      id: comment.id,
      content: comment.content,
      author: {
        id: comment.author.id,
        username: (comment.author as any).username || comment.author.email,
      },
      likeCount: comment.likeCount,
      replyCount: comment.replyCount,
      recentReplies: recentReplies.map((r) => ({
        id: r.id,
        content: r.content,
        author: {
          id: r.author.id,
          username: (r.author as any).username || r.author.email,
        },
      })),
    };
  }
}
