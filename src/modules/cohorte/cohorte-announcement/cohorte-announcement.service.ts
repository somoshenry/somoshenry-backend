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
import { UserRole } from '../../user/entities/user.entity';

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

  async create(dto: CreateCohorteAnnouncementDto, userId: string) {
    const cohorte = await this.cohorteRepo.findOne({
      where: { id: dto.cohorteId },
    });
    if (!cohorte) throw new NotFoundException('Cohorte no encontrada');

    const authorMember = await this.memberRepo.findOne({
      where: { cohorte: { id: dto.cohorteId }, user: { id: userId } },
      relations: ['user'],
    });
    if (!authorMember)
      throw new ForbiddenException('No perteneces a esta cohorte');

    // ✅ AGREGAR: Obtener el usuario completo
    const requestingUser = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!requestingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // ✅ Verificar permisos
    if (
      requestingUser.role !== UserRole.ADMIN &&
      authorMember.role !== CohorteRoleEnum.TEACHER
    ) {
      throw new ForbiddenException('No autorizado');
    }

    // ✅ author es requestingUser
    const author = requestingUser;

    const newAnnouncement = this.announcementRepo.create({
      title: dto.title,
      content: dto.content,
      cohorte,
      author: author, // ✅ Ya no es null
    });

    const saved: CohorteAnnouncement =
      await this.announcementRepo.save(newAnnouncement);

    // 🔔 emitir anuncio en tiempo real
    this.gateway.emitAnnouncement(cohorte.id, {
      id: saved.id,
      cohorteId: cohorte.id,
      title: saved.title,
      content: saved.content,
      author: {
        id: author.id,
        // ✅ CORREGIR: User tiene 'name' y 'lastName'
        name:
          author.name && author.lastName
            ? `${author.name} ${author.lastName}`
            : author.name || author.username || 'Usuario',
        // ✅ CORREGIR: User tiene 'profilePicture'
        profileImage: author.profilePicture || null,
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
