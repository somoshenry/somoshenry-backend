import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { UserRole } from '../user/entities/user.entity';
import { PostService } from '../post/post.service';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private readonly repo: Repository<Report>,

    @Inject(forwardRef(() => PostService))
    private readonly postService: PostService,
  ) {}

  async create(dto: CreateReportDto, reporterId: string) {
    // 🔹 Validar que solo venga un objetivo
    const targets = [dto.postId, dto.commentId, dto.reportedUserId].filter(
      Boolean,
    );

    if (targets.length !== 1) {
      throw new BadRequestException(
        'Debes reportar un post, un comentario o un usuario, no más de uno.',
      );
    }

    // 🔹 No puede reportarse a sí mismo
    if (dto.reportedUserId && dto.reportedUserId === reporterId) {
      throw new BadRequestException('No puedes reportarte a ti mismo.');
    }

    // -------------------------
    // VALIDACIONES DE OBJETIVO
    // -------------------------

    // 🔸 Validar usuario reportado
    if (dto.reportedUserId) {
      const user = await this.repo.manager.findOne('User', {
        where: { id: dto.reportedUserId },
      });
      if (!user) {
        throw new NotFoundException('Usuario a reportar no encontrado.');
      }
    }

    // 🔸 Validar post
    if (dto.postId) {
      const post = await this.repo.manager.findOne('Post', {
        where: { id: dto.postId },
      });
      if (!post) {
        throw new NotFoundException('El post que intentas reportar no existe.');
      }
    }

    // 🔸 Validar comentario
    if (dto.commentId) {
      const comment = await this.repo.manager.findOne('Comment', {
        where: { id: dto.commentId },
      });
      if (!comment) {
        throw new NotFoundException(
          'El comentario que intentas reportar no existe.',
        );
      }
    }

    // -------------------------
    // CREAR REPORTE
    // -------------------------
    const report = this.repo.create({
      ...dto,
      reporterId,
      status: ReportStatus.PENDING,
    });

    const savedReport = await this.repo.save(report);

    // 🔹 Auto-flag solo para post
    if (dto.postId) {
      await this.postService.evaluateAutoFlag(dto.postId);
    }

    return savedReport;
  }

  async findAll(status?: ReportStatus) {
    const where = status ? { status } : {};

    return this.repo.find({
      where,
      relations: ['reporter', 'post', 'comment', 'reportedUser', 'reviewer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPending() {
    return this.repo.find({
      where: { status: ReportStatus.PENDING },
      relations: ['reporter', 'post', 'comment', 'reportedUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateReportDto,
    reviewerId: string,
    reviewerRole: UserRole,
  ) {
    if (reviewerRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Solo los administradores pueden revisar reportes.',
      );
    }

    const report = await this.repo.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Reporte no encontrado.');

    report.status = dto.status;
    report.reviewedBy = dto.reviewerId ?? reviewerId;
    report.reviewedAt = new Date();

    return this.repo.save(report);
  }
}
