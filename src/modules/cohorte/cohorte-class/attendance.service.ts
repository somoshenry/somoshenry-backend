import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CohorteClass } from './entities/cohorte-class.entity';
import { ClassAttendance } from './entities/class-attendance.entity';
import { Cohorte } from '../cohorte/entities/cohorte.entity';
import { CohorteMember } from '../cohorte/entities/cohorte-member.entity';
import { User } from '../../user/entities/user.entity';
import {
  AttendanceTypeEnum,
  AttendanceStatusEnum,
  CohorteRoleEnum,
} from '../cohorte/enums/cohorte.enums';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(CohorteClass)
    private readonly classRepo: Repository<CohorteClass>,
    @InjectRepository(ClassAttendance)
    private readonly attendanceRepo: Repository<ClassAttendance>,
    @InjectRepository(Cohorte)
    private readonly cohorteRepo: Repository<Cohorte>,
    @InjectRepository(CohorteMember)
    private readonly memberRepo: Repository<CohorteMember>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  /** Crear lista automática (STAND_UP + HANDS_ON) para todos los STUDENT del cohorte */
  async generateForClass(classId: string, cohorteId: string): Promise<void> {
    const klass = await this.classRepo.findOne({
      where: { id: classId },
      relations: ['cohorte'],
    });
    if (!klass) throw new NotFoundException('Clase no encontrada');

    const students = await this.memberRepo.find({
      where: { cohorte: { id: cohorteId }, role: CohorteRoleEnum.STUDENT },
      relations: ['user'],
    });
    if (students.length === 0) return;

    const studentUsers = students.map((m) => m.user);

    const exists = await this.attendanceRepo.find({
      where: { classSession: { id: classId }, student: In(studentUsers) },
    });
    if (exists.length > 0) return; // ya generada previamente

    const toCreate: ClassAttendance[] = [];
    for (const u of studentUsers) {
      toCreate.push(
        this.attendanceRepo.create({
          classSession: { id: classId } as any,
          student: { id: u.id } as any,
          status: AttendanceStatusEnum.ABSENT, // default inicial
          type: AttendanceTypeEnum.STAND_UP,
        }),
      );
      toCreate.push(
        this.attendanceRepo.create({
          classSession: { id: classId } as any,
          student: { id: u.id } as any,
          status: AttendanceStatusEnum.ABSENT,
          type: AttendanceTypeEnum.HANDS_ON,
        }),
      );
    }
    await this.attendanceRepo.save(toCreate);
  }

  /** Marcar asistencia (masivo) validando rol de quien marca según el type */
  async markAttendance(
    classId: string,
    dto: MarkAttendanceDto,
    markerUserId: string,
  ): Promise<void> {
    const klass = await this.classRepo.findOne({
      where: { id: classId },
      relations: ['cohorte'],
    });
    if (!klass) throw new NotFoundException('Clase no encontrada');

    const markerMember = await this.memberRepo.findOne({
      where: { cohorte: { id: klass.cohorte.id }, user: { id: markerUserId } },
      relations: ['cohorte', 'user'],
    });
    if (!markerMember)
      throw new ForbiddenException('No perteneces a esta cohorte');

    // Reglas:
    // - STAND_UP: solo TA (o Admin si querés extender)
    // - HANDS_ON: TEACHER (o Admin)
    const isTA = markerMember.role === CohorteRoleEnum.TA;
    const isTeacher = markerMember.role === CohorteRoleEnum.TEACHER;

    if (dto.type === AttendanceTypeEnum.STAND_UP && !isTA && !isTeacher) {
      throw new ForbiddenException('Solo TA/Teacher pueden marcar STAND_UP');
    }
    if (dto.type === AttendanceTypeEnum.HANDS_ON && !isTeacher) {
      throw new ForbiddenException('Solo Teacher puede marcar HANDS_ON');
    }

    const ids = dto.records.map((r) => r.studentId);
    const students = await this.userRepo.find({ where: { id: In(ids) } });
    if (students.length !== ids.length)
      throw new NotFoundException('Algún studentId no existe');

    for (const r of dto.records) {
      let row = await this.attendanceRepo.findOne({
        where: {
          classSession: { id: classId },
          student: { id: r.studentId },
          type: dto.type,
        },
      });

      if (!row) {
        row = this.attendanceRepo.create({
          classSession: { id: classId } as any,
          student: { id: r.studentId } as any,
          type: dto.type,
          status: r.status,
          notes: r.notes,
        });
      } else {
        row.status = r.status;
        row.notes = r.notes;
      }
      await this.attendanceRepo.save(row);
    }

    // Actualizar % de asistencia por alumno del cohorte (rápido y consistente):
    await this.recalculateCohortePercentages(klass.cohorte.id);
  }

  /** Obtener asistencia de la clase (ambos tipos) */
  getClassAttendance(classId: string) {
    return this.attendanceRepo.find({
      where: { classSession: { id: classId } },
      relations: ['student'],
      order: { createdAt: 'ASC' },
    });
  }

  /** Obtener asistencia de un alumno en una cohorte */
  getStudentAttendance(cohorteId: string, studentId: string) {
    return this.attendanceRepo.find({
      where: {
        classSession: { cohorte: { id: cohorteId } as any },
        student: { id: studentId },
      },
      relations: ['classSession'],
      order: { createdAt: 'ASC' },
    });
  }

  /** Recalcular y guardar porcentaje en CohorteMember.attendance */
  async recalculateCohortePercentages(cohorteId: string): Promise<void> {
    const members = await this.memberRepo.find({
      where: { cohorte: { id: cohorteId }, role: CohorteRoleEnum.STUDENT },
      relations: ['user'],
    });
    for (const m of members) {
      const total = await this.attendanceRepo.count({
        where: {
          classSession: { cohorte: { id: cohorteId } as any },
          student: { id: m.user.id },
        },
      });
      if (total === 0) {
        m.attendance = 0;
      } else {
        const presents = await this.attendanceRepo.count({
          where: {
            classSession: { cohorte: { id: cohorteId } as any },
            student: { id: m.user.id },
            status: AttendanceStatusEnum.PRESENT,
          },
        });
        m.attendance = Math.round((presents * 10000) / total) / 100; // 2 decimales
      }
      await this.memberRepo.save(m);
    }
  }
}
