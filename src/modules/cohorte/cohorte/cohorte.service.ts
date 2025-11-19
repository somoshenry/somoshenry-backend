import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
  UnauthorizedException,
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
      type: NotificationType.COHORTE_INVITATION,
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
  // OBTENER MIS COHORTES (COHORTES DONDE ESTOY INSCRITO)
  // ============================================
  async getMyCohortes(userId: string) {
    // Verificar que el usuario existe
    const userExists = await this.userRepo.exists({ where: { id: userId } });
    if (!userExists) {
      throw new UnauthorizedException('Usuario no válido');
    }

    // Buscar en la tabla intermedia cohorte_members
    const members = await this.memberRepo.find({
      where: {
        user: { id: userId },
        // status: MemberStatusEnum.ACTIVE, // Solo cohortes activos
      },
      relations: ['cohorte'], // Traer info del cohorte
      order: { joinedAt: 'DESC' }, // Más recientes primero
    });

    // Mapear para devolver info útil
    return members.map((member) => ({
      // Info del cohorte
      cohorte: {
        id: member.cohorte.id,
        name: member.cohorte.name,
        description: member.cohorte.description,
        startDate: member.cohorte.startDate,
        endDate: member.cohorte.endDate,
        status: member.cohorte.status,
        schedule: member.cohorte.schedule,
        modality: member.cohorte.modality,
      },
      // Info de mi membresía
      myRole: member.role, // TEACHER, STUDENT, TA
      myStatus: member.status,
      joinedAt: member.joinedAt,
      // Si soy estudiante - usando operador ternario
      ...(member.role === 'STUDENT' && {
        attendance: member.attendance,
        finalGrade: member.finalGrade,
      }),
    }));
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
