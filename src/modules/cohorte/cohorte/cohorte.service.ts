import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cohorte } from './entities/cohorte.entity';
import { CohorteMember } from './entities/cohorte-member.entity';
import { CreateCohorteDto } from './dto/create-cohorte.dto';
import { UpdateCohorteDto } from './dto/update-cohorte.dto';
import { User } from '../../user/entities/user.entity';
import { CohorteRoleEnum, MemberStatusEnum } from './enums/cohorte.enums';
import { NotificationService } from '../../notifications/socket/notification.service';
import { NotificationType } from '../../notifications/socket/entities/notification.entity';

@Injectable()
export class CohorteService {
  private readonly logger = new Logger(CohorteService.name);

  constructor(
    @InjectRepository(Cohorte)
    private readonly cohorteRepo: Repository<Cohorte>,

    @InjectRepository(CohorteMember)
    private readonly memberRepo: Repository<CohorteMember>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
  ) {}

  //  Crear cohorte
  async create(dto: CreateCohorteDto): Promise<Cohorte> {
    const cohorte = this.cohorteRepo.create(dto);
    return this.cohorteRepo.save(cohorte);
  }

  //  Obtener todas las cohortes
  async findAll(): Promise<Cohorte[]> {
    return this.cohorteRepo.find({
      relations: ['members', 'members.user', 'classes'],
      order: { createdAt: 'DESC' },
    });
  }

  //  Obtener cohorte por ID
  async findOne(id: string): Promise<Cohorte> {
    const cohorte = await this.cohorteRepo.findOne({
      where: { id },
      relations: ['members', 'members.user', 'classes'],
    });

    if (!cohorte) throw new NotFoundException('Cohorte no encontrada');
    return cohorte;
  }

  //  Actualizar cohorte
  async update(id: string, dto: UpdateCohorteDto): Promise<Cohorte> {
    const cohorte = await this.findOne(id);
    Object.assign(cohorte, dto);
    return this.cohorteRepo.save(cohorte);
  }

  //  Eliminar cohorte
  async remove(id: string): Promise<void> {
    const cohorte = await this.findOne(id);
    await this.cohorteRepo.remove(cohorte);
  }

  //  Agregar miembro a cohorte
  async addMember(
    cohorteId: string,
    userId: string,
    role: CohorteRoleEnum,
  ): Promise<CohorteMember> {
    const cohorte = await this.findOne(cohorteId);
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    const existing = await this.memberRepo.findOne({
      where: { cohorte: { id: cohorteId }, user: { id: userId } },
    });
    if (existing)
      throw new BadRequestException('El usuario ya pertenece a la cohorte');

    const member = this.memberRepo.create({
      cohorte,
      user,
      role,
    });

    const saved = await this.memberRepo.save(member);

    const teacherMember = await this.memberRepo.findOne({
      where: {
        cohorte: { id: cohorteId },
        role: CohorteRoleEnum.TEACHER,
      },
      relations: ['user'],
    });

    const senderId = teacherMember?.user?.id || userId;

    await this.notificationService.create({
      receiverId: userId,
      senderId,
      type: NotificationType.COHORTE_ASSIGNED,
      metadata: {
        cohorteId: cohorte.id,
        cohorteName: cohorte.name,
        role,
      },
    });

    return saved;
  }

  //  Remover miembro
  async removeMember(cohorteId: string, userId: string): Promise<void> {
    const member = await this.memberRepo.findOne({
      where: { cohorte: { id: cohorteId }, user: { id: userId } },
    });

    if (!member) throw new NotFoundException('Miembro no encontrado');
    await this.memberRepo.remove(member);
  }

  // ============================================
  // OBTENER MIS COHORTES (TODAS LAS COHORTES DONDE ESTOY)
  // ============================================
  async getMyCohortes(userId: string) {
    try {
      this.logger.log(`[getMyCohortes] Iniciando para usuario: ${userId}`);

      // Verificar que el usuario existe
      const userExists = await this.userRepo.exists({ where: { id: userId } });
      if (!userExists) {
        this.logger.warn(`Usuario ${userId} no existe`);
        throw new UnauthorizedException('Usuario no válido');
      }

      // Buscar memberships del usuario
      const members = await this.memberRepo.find({
        where: { user: { id: userId } },
        relations: ['cohorte'],
        order: { joinedAt: 'DESC' },
      });

      this.logger.log(
        `[getMyCohortes] Encontrados ${members?.length || 0} memberships`,
      );

      if (!members || members.length === 0) {
        return [];
      }

      // Mapear los resultados
      const result = members
        .map((member) => {
          // Validar que el cohorte existe
          if (!member.cohorte) {
            this.logger.warn(`Member ${member.id} sin cohorte asociado`);
            return null;
          }

          return {
            cohorte: {
              id: member.cohorte.id,
              name: member.cohorte.name,
              description: member.cohorte.description ?? null,
              startDate: member.cohorte.startDate ?? null,
              endDate: member.cohorte.endDate ?? null,
              status: member.cohorte.status,
              schedule: member.cohorte.schedule ?? null,
              modality: member.cohorte.modality,
            },
            myRole: member.role,
            myStatus: member.status,
            joinedAt: member.joinedAt,
            attendance:
              member.role === CohorteRoleEnum.STUDENT
                ? (member.attendance ?? null)
                : undefined,
            finalGrade:
              member.role === CohorteRoleEnum.STUDENT
                ? (member.finalGrade ?? null)
                : undefined,
          };
        })
        .filter((item): item is Exclude<typeof item, null> => item !== null);

      this.logger.log(`[getMyCohortes] Retornando ${result.length} cohortes`);
      return result;
    } catch (error) {
      this.logger.error(`[getMyCohortes] Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ============================================
  // OBTENER COHORTES DONDE SOY PROFESOR
  // ============================================
  async getMyCohorteAsTeacher(userId: string) {
    // Verificar que el usuario existe
    const userExists = await this.userRepo.exists({ where: { id: userId } });
    if (!userExists) {
      throw new UnauthorizedException('Usuario no válido');
    }

    const members = await this.memberRepo.find({
      where: {
        user: { id: userId },
        role: CohorteRoleEnum.TEACHER,
        status: MemberStatusEnum.ACTIVE,
      },
      relations: ['cohorte'],
      order: { joinedAt: 'DESC' },
    });

    return members.map((member) => ({
      cohorte: member.cohorte,
      myRole: member.role,
      joinedAt: member.joinedAt,
    }));
  }

  // ============================================
  // OBTENER COHORTES DONDE SOY ESTUDIANTE
  // ============================================
  async getMyCohortesAsStudent(userId: string) {
    // Verificar que el usuario existe
    const userExists = await this.userRepo.exists({ where: { id: userId } });
    if (!userExists) {
      throw new UnauthorizedException('Usuario no válido');
    }

    const members = await this.memberRepo.find({
      where: {
        user: { id: userId },
        role: CohorteRoleEnum.STUDENT,
        status: MemberStatusEnum.ACTIVE,
      },
      relations: ['cohorte'],
      order: { joinedAt: 'DESC' },
    });

    return members.map((member) => ({
      cohorte: member.cohorte,
      myRole: member.role,
      joinedAt: member.joinedAt,
      attendance: member.attendance,
      finalGrade: member.finalGrade,
    }));
  }
}
