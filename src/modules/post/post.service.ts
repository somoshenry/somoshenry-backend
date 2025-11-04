import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../user/entities/user.entity';

import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PostLike)
    private readonly postLikeRepository: Repository<PostLike>,
  ) {}

  async create(createPostDto: CreatePostDto, userId: string): Promise<Post> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const post = this.postRepository.create({
      userId,
      ...createPostDto,
    });

    const savedPost = await this.postRepository.save(post);

    const createdPost = await this.postRepository.findOne({
      where: { id: savedPost.id },
      relations: ['user'],
    });

    if (!createdPost) {
      throw new Error('No se pudo obtener la publicación creada');
    }

    return createdPost;
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [posts, total] = await this.postRepository.findAndCount({
      relations: ['user'],
      order: {
        createdAt: 'DESC',
      },
      skip,
      take: limit,
      where: {
        isInappropriate: false,
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: posts,
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

  async findOne(id: string) {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!post) {
      throw new Error(`Publicación con ID ${id} no encontrada`);
    }

    return post;
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    userId: string,
    userRole: UserRole,
  ): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }

    if (post.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar esta publicación',
      );
    }

    const updatedPost = this.postRepository.merge(post, updatePostDto);

    await this.postRepository.save(updatedPost);

    const result = await this.postRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!result) {
      throw new Error('No se pudo obtener la publicación actualizada');
    }

    return result;
  }

  async remove(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<{ message: string; deletedPost: Post }> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!post) {
      throw new NotFoundException(`Publicación con ID ${id} no encontrada`);
    }

    if (post.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar esta publicación',
      );
    }

    await this.postRepository.remove(post);

    return {
      message: 'Publicación eliminada correctamente',
      deletedPost: post,
    };
  }

  async likePost(postId: string, userId: string) {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new Error('Publicación no encontrada');
    }

    const existing = await this.postLikeRepository.findOne({
      where: { postId, userId },
    });

    if (existing) {
      throw new Error('Ya diste like a esta publicación');
    }

    const like = this.postLikeRepository.create({ postId, userId });
    await this.postLikeRepository.save(like);

    const likeCount = await this.postLikeRepository.count({
      where: { postId },
    });
    return { message: 'Like agregado correctamente', likeCount };
  }

  async unlikePost(postId: string, userId: string) {
    const existing = await this.postLikeRepository.findOne({
      where: { postId, userId },
    });

    if (!existing) {
      throw new Error('No diste like a esta publicación');
    }

    await this.postLikeRepository.remove(existing);

    const likeCount = await this.postLikeRepository.count({
      where: { postId },
    });
    return { message: 'Like eliminado correctamente', likeCount };
  }

  async getLikesCount(postId: string) {
    const count = await this.postLikeRepository.count({ where: { postId } });
    return { postId, likeCount: count };
  }
}
