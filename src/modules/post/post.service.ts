import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { UserRole } from '../user/entities/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';
import { User } from '../user/entities/user.entity';
import { PostDislike } from './entities/post-dislike.entity';
import { PostView } from './entities/post-view.entity';
import { Report, ReportReason } from '../report/entities/report.entity';
import { FilterPostsDto } from './dto/filter-posts.dto';
import { NotificationService } from '../notifications/socket/notification.service';
import { NotificationType } from '../notifications/socket/entities/notification.entity';
import { OpenAIService } from '../open-ai/openai.service';
import { CreateReportDto } from '../report/dto/create-report.dto';
import { ReportService } from '../report/report.service';
import { DevLogger } from '../../common/utils/dev-logger';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PostView)
    private readonly postViewRepository: Repository<PostView>,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(PostDislike)
    private readonly postDislikeRepository: Repository<PostDislike>,
    @InjectRepository(PostLike)
    private readonly postLikeRepository: Repository<PostLike>,
    private readonly notificationService: NotificationService,
    private readonly openAiService: OpenAIService,
    @Inject(forwardRef(() => ReportService))
    private readonly reportService: ReportService,
  ) {}

  async create(createPostDto: CreatePostDto, userId: string): Promise<Post> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    const isInappropriate = await this.openAiService.isInappropriate(
      createPostDto.content,
    );

    const post = this.postRepository.create({
      userId,
      ...createPostDto,
    });

    const savedPost = await this.postRepository.save(post);

    if (isInappropriate) {
      const createReportDto = new CreateReportDto();
      createReportDto.postId = post.id;
      createReportDto.reason = ReportReason.INAPPROPRIATE;
      await this.reportService.create(createReportDto, userId);
    }

    const createdPost = await this.postRepository.findOne({
      where: { id: savedPost.id },
      relations: ['user'],
    });

    if (!createdPost) {
      throw new Error('No se pudo obtener la publicación creada');
    }

    return createdPost;
  }

  // async findAll(page: number = 1, limit: number = 10) {
  //   const skip = (page - 1) * limit;

  //   const [posts, total] = await this.postRepository.findAndCount({
  //     relations: ['user'],
  //     order: {
  //       createdAt: 'DESC',
  //     },
  //     skip,
  //     take: limit,
  //     where: {
  //       isInappropriate: false,
  //     },
  //   });

  //   const totalPages = Math.ceil(total / limit);

  //   return {
  //     data: posts,
  //     meta: {
  //       total,
  //       page,
  //       limit,
  //       totalPages,
  //       hasNextPage: page < totalPages,
  //       hasPreviousPage: page > 1,
  //     },
  //   };
  // }

  async findAllWithFilters(filterDto: FilterPostsDto, user?: User) {
    const {
      page = 1,
      limit = 20,
      type,
      search,
      userId,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      order = 'DESC',
    } = filterDto;

    const skip = (page - 1) * limit;

    // Crear query builder
    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user');

    // Solo filtrar posts inapropiados si el usuario NO es admin
    if (!user || user.role !== UserRole.ADMIN) {
      queryBuilder.where('post.isInappropriate = :isInappropriate', {
        isInappropriate: false,
      });
    }

    // FILTRO 1: Por tipo de post
    if (type) {
      queryBuilder.andWhere('post.type = :type', { type });
    }

    // FILTRO 2: Búsqueda en contenido (texto)
    if (search) {
      queryBuilder.andWhere('post.content ILIKE :search', {
        search: `%${search}%`,
      });
    }

    // FILTRO 3: Por usuario específico
    if (userId) {
      queryBuilder.andWhere('post.userId = :userId', { userId });
    }

    // FILTRO 4: Por rango de fechas
    if (dateFrom) {
      queryBuilder.andWhere('post.createdAt >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      queryBuilder.andWhere('post.createdAt <= :dateTo', { dateTo });
    }

    // ORDENAMIENTO
    queryBuilder.orderBy(`post.${sortBy}`, order);

    // PAGINACIÓN
    queryBuilder.skip(skip).take(limit);

    // Ejecutar query
    const [posts, total] = await queryBuilder.getManyAndCount();

    return {
      data: posts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        filters: {
          type: type || null,
          search: search || null,
          userId: userId || null,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
        },
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

    post.viewsCount += 1;
    await this.postRepository.update(post.id, { viewsCount: post.viewsCount });

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

  async dislikePost(postId: string, userId: string) {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) throw new Error('Publicación no encontrada');

    const existing = await this.postDislikeRepository.findOne({
      where: { postId, userId },
    });
    if (existing) throw new Error('Ya diste dislike a esta publicación');

    const liked = await this.postLikeRepository.findOne({
      where: { postId, userId },
    });
    if (liked) await this.postLikeRepository.remove(liked);

    const dislike = this.postDislikeRepository.create({ postId, userId });
    await this.postDislikeRepository.save(dislike);

    const dislikeCount = await this.postDislikeRepository.count({
      where: { postId },
    });
    await this.postRepository.update(postId, { dislikeCount });

    return { message: 'Dislike agregado correctamente', dislikeCount };
  }

  async removeDislike(postId: string, userId: string) {
    const existing = await this.postDislikeRepository.findOne({
      where: { postId, userId },
    });

    if (!existing) throw new Error('No diste dislike a esta publicación');

    await this.postDislikeRepository.remove(existing);

    const dislikeCount = await this.postDislikeRepository.count({
      where: { postId },
    });
    await this.postRepository.update(postId, { dislikeCount });

    return { message: 'Dislike eliminado correctamente', dislikeCount };
  }

  async getDislikesCount(postId: string) {
    const count = await this.postDislikeRepository.count({ where: { postId } });
    return { postId, dislikeCount: count };
  }

  async registerView(postId: string, userId: string) {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) throw new Error('Publicación no encontrada');

    const existing = await this.postViewRepository.findOne({
      where: { postId, userId },
    });
    if (existing)
      return { message: 'Vista ya registrada', viewsCount: post.viewsCount };

    const view = this.postViewRepository.create({ postId, userId });
    await this.postViewRepository.save(view);

    post.viewsCount += 1;
    await this.postRepository.update(post.id, { viewsCount: post.viewsCount });

    return {
      message: 'Vista registrada correctamente',
      viewsCount: post.viewsCount,
    };
  }

  async evaluateAutoFlag(postId: string): Promise<void> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) return;

    const [reports, dislikes, views] = await Promise.all([
      this.reportRepository.count({ where: { postId } }),
      this.postDislikeRepository.count({ where: { postId } }),
      this.postViewRepository.count({ where: { postId } }),
    ]);

    const totalRejection = reports + dislikes;
    const ratio = views > 0 ? totalRejection / views : 0;

    if (ratio >= 0.1 && !post.isInappropriate) {
      post.isInappropriate = true;
      await this.postRepository.save(post);
      DevLogger.log(
        `Auto-flag aplicado al post ${postId} (ratio ${(ratio * 100).toFixed(2)}%)`,
      );
    }
  }

  async moderatePost(
    postId: string,
    isInappropriate: boolean,
    adminId: string,
  ) {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Publicación no encontrada.');

    post.isInappropriate = isInappropriate;
    post.moderatedBy = adminId;
    post.moderatedAt = new Date();

    await this.postRepository.save(post);

    return {
      message: `Publicación ${isInappropriate ? 'marcada como inapropiada' : 'restaurada'}`,
      post,
    };
  }

  async findModerated(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [posts, total] = await this.postRepository.findAndCount({
      where: { isInappropriate: true },
      relations: ['user'],
      order: { moderatedAt: 'DESC' },
      skip,
      take: limit,
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

  async findReported(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoin('reports', 'r', 'r.postId = post.id')
      .where('r.status = :status', { status: 'PENDING' })
      .andWhere('post.isInappropriate = false')
      .select([
        'post.id',
        'post.content',
        'post.createdAt',
        'user.id',
        'user.name',
        'COUNT(r.id) AS reportsCount',
        'MAX(r.createdAt) AS lastReportAt',
      ])
      .groupBy('post.id')
      .addGroupBy('user.id')
      .orderBy('reportsCount', 'DESC')
      .offset(skip)
      .limit(limit);

    const { entities, raw } = await query.getRawAndEntities();

    const total = entities.length;
    const totalPages = Math.ceil(total / limit);

    type RawReportRow = {
      reportsCount?: string | number;
      lastReportAt?: string | Date | null;
    };

    const data = entities.map((post, index) => {
      const rawRow = raw[index] as RawReportRow;

      return {
        ...post,
        reportsCount: Number(rawRow?.reportsCount ?? 0),
        lastReportAt: rawRow?.lastReportAt ?? null,
      };
    });

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

  // Método para contar posts en un período
  async countPostsInPeriod(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const count = await this.postRepository.count({
      where: {
        userId,
        createdAt: Between(startDate, endDate),
      },
    });
    return count;
  }
}
