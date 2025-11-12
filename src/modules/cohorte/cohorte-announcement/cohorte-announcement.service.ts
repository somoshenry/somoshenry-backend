import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CohorteAnnouncement } from './entities/cohorte-announcement.entity';
import { CreateCohorteAnnouncementDto } from './dto/create-cohorte-announcement.dto';
import { Cohorte } from '../cohorte/entities/cohorte.entity';
import { User } from '../../user/entities/user.entity';
import { CohorteMember } from '../cohorte/entities/cohorte-member.entity';
import { CohorteRoleEnum } from '../cohorte/enums/cohorte.enums';
import { CohorteAnnouncementGateway } from './cohorte-announcement.gateway';

@Injectable()
export class CohorteAnnouncementService {
  constructor(
    @InjectRepository(CohorteAnnouncement)
    private readonly announcementRepo: Repository<CohorteAnnouncement>,
    @InjectRepository(Cohorte)
    private readonly cohorteRepo: Repository<Cohorte>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(CohorteMember)
    private readonly memberRepo: Repository<CohorteMember>,
    private readonly gateway: CohorteAnnouncementGateway,
  ) {}

  async create(dto: CreateCohorteAnnouncementDto, authorId: string) {
    const cohorte = await this.cohorteRepo.findOne({
      where: { id: dto.cohorteId },
    });
    if (!cohorte) throw new NotFoundException('Cohorte no encontrada');

    const authorMember = await this.memberRepo.findOne({
      where: { cohorte: { id: dto.cohorteId }, user: { id: authorId } },
      relations: ['user'],
    });
    if (!authorMember)
      throw new ForbiddenException('No perteneces a esta cohorte');

    if (![CohorteRoleEnum.TEACHER].includes(authorMember.role)) {
      throw new ForbiddenException(
        'Solo el TEACHER o ADMIN pueden crear anuncios',
      );
    }

    const author = await this.userRepo.findOne({ where: { id: authorId } });

    const newAnnouncement = this.announcementRepo.create({
      ...dto, // ⬅️ ACA ESTABA EL ERROR (.dto)
      cohorte,
      author,
    });

    const saved = await this.announcementRepo.save(newAnnouncement);

    // 🔔 emitir anuncio en tiempo real a todos los conectados a esa cohorte
    this.gateway.emitAnnouncement(cohorte.id, {
      id: saved.id,
      cohorteId: cohorte.id,
      title: saved.title,
      content: saved.content,
      author: {
        id: author.id,
        name: `${author.firstName} ${author.lastName}`,
        profileImage: author.profileImage,
      },
      createdAt: saved.createdAt,
      pinned: saved.pinned,
    });

    return saved;
  }

  async findByCohorte(cohorteId: string) {
    return this.announcementRepo.find({
      where: { cohorte: { id: cohorteId } },
      order: { pinned: 'DESC', createdAt: 'DESC' },
    });
  }

  async remove(id: string, userId: string) {
    const announcement = await this.announcementRepo.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!announcement) throw new NotFoundException('Anuncio no encontrado');

    if (announcement.author.id !== userId) {
      throw new ForbiddenException('No puedes eliminar anuncios de otros');
    }

    await this.announcementRepo.remove(announcement);
  }

  async togglePin(id: string, userId: string) {
    const announcement = await this.announcementRepo.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!announcement) throw new NotFoundException('Anuncio no encontrado');

    if (announcement.author.id !== userId) {
      throw new ForbiddenException('Solo el autor puede fijar o desfijar');
    }

    announcement.pinned = !announcement.pinned;
    return this.announcementRepo.save(announcement);
  }
}
