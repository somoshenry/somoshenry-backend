import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportStatus } from './entities/report.entity';
import { UserRole } from '../user/entities/user.entity';
import { PostService } from '../post/post.service';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private readonly repo: Repository<Report>,
    private readonly postService: PostService,
  ) {}

  async create(dto: CreateReportDto, reporterId: string) {
    // Validación: solo uno de los tres campos debe estar presente
    const reportTargets = [
      dto.postId,
      dto.commentId,
      dto.reportedUserId,
    ].filter(Boolean);

    if (reportTargets.length !== 1) {
      throw new BadRequestException(
        'Debes reportar un post, un comentario o un usuario, no más de uno.',
      );
    }

    // Validación adicional: no puede reportarse a sí mismo
    if (dto.reportedUserId && dto.reportedUserId === reporterId) {
      throw new BadRequestException('No puedes reportarte a ti mismo.');
    }

    const report = this.repo.create({
      ...dto,
      reporterId,
      status: ReportStatus.PENDING,
    });

    const savedReport = await this.repo.save(report);

    // Solo evaluar auto-flag si es un post
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
