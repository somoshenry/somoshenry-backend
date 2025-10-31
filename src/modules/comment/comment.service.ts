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

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(CommentLike)
    private readonly commentLikeRepository: Repository<CommentLike>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async create(
    createCommentDto: CreateCommentDto,
    userId: string,
  ): Promise<Comment> {
    // 🔹 Extendemos el DTO con postId (que no está en la interfaz)
    const dto = createCommentDto as CreateCommentDto & { postId: string };

    const post = await this.postRepository.findOne({
      where: { id: dto.postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    let parentComment: Comment | null = null;
    if (dto.parentId) {
      parentComment = await this.commentRepository.findOne({
        where: { id: dto.parentId },
      });
      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = this.commentRepository.create({
      ...dto,
      authorId: userId,
      parentId: parentComment?.id,
    });

    await this.commentRepository.save(comment);

    if (parentComment) {
      await this.commentRepository.increment(
        { id: parentComment.id },
        'replyCount',
        1,
      );
    }

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
}
