import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CohorteClass } from './entities/cohorte-class.entity';
import { ClassAttendance } from './entities/class-attendance.entity';
import { CreateCohorteClassDto } from './dto/create-cohorte-class.dto';
import { UpdateCohorteClassDto } from './dto/update-cohorte-class.dto';
import { Cohorte } from '../cohorte/entities/cohorte.entity';
import { User } from '../../user/entities/user.entity';
import { AttendanceService } from './attendance.service'; // AGREGAR si lo usas

@Injectable()
export class CohorteClassService {
  constructor(
    @InjectRepository(CohorteClass)
    private readonly classRepo: Repository<CohorteClass>,
    @InjectRepository(ClassAttendance)
    private readonly attendanceRepo: Repository<ClassAttendance>,
    @InjectRepository(Cohorte)
    private readonly cohorteRepo: Repository<Cohorte>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    // AGREGAR si usas attendanceService
    // private readonly attendanceService: AttendanceService,
  ) {}

  async create(dto: CreateCohorteClassDto): Promise<CohorteClass> {
    const cohorte = await this.cohorteRepo.findOne({
      where: { id: dto.cohorteId },
      relations: ['members'], // Cargar miembros para generar asistencia
    });
    if (!cohorte) throw new NotFoundException('Cohorte no encontrada');

    let teacher: User | undefined;
    if (dto.teacherId) {
      const foundTeacher = await this.userRepo.findOne({
        where: { id: dto.teacherId },
      });
      if (!foundTeacher) throw new NotFoundException('Profesor no encontrado');
      teacher = foundTeacher;
    }

    // CORREGIR: Solo usar propiedades que existen en la entidad
    const newClass = this.classRepo.create({
      cohorte,
      name: dto.name,
      description: dto.description,
      module: dto.module,
      scheduledDate: dto.scheduledDate,
      duration: dto.duration,
      teacher: teacher,
      meetingUrl: dto.meetingUrl,
      recordingUrl: dto.recordingUrl,
      materialsUrl: dto.materialsUrl,
      status: dto.status,
      // Si agregaste startDate y endDate a la entidad, descomenta:
      // startDate: dto.startDate,
      // endDate: dto.endDate,
    });

    const saved = await this.classRepo.save(newClass);

    // Si usas attendanceService, descomenta:
    // await this.attendanceService.generateForClass(saved.id, cohorte.id);

    return saved;
  }

  findAll(): Promise<CohorteClass[]> {
    return this.classRepo.find({ relations: ['cohorte', 'teacher'] });
  }

  async findAllbyCohort(cohorteId: string): Promise<CohorteClass[]> {
    // Validar que el cohorte existe
    const cohorte = await this.cohorteRepo.findOne({
      where: { id: cohorteId },
    });

    if (!cohorte) {
      throw new NotFoundException(`Cohorte ${cohorteId} no encontrado`);
    }

    const classes = await this.classRepo.find({
      where: { cohorte: { id: cohorteId } },
      relations: ['cohorte', 'teacher'],
      order: { createdAt: 'DESC' },
    });
    // Verificar longitud del array
    // if (classes.length === 0) {
    //   throw new NotFoundException(
    //     `No se encontraron clases para la cohorte ${cohorteId}`,
    //   );
    // }

    // Buscar clases (retornar [] si no hay)
    return classes;
  }

  async findOne(id: string): Promise<CohorteClass> {
    const klass = await this.classRepo.findOne({
      where: { id },
      relations: ['cohorte', 'teacher', 'attendances', 'attendances.student'],
    });
    if (!klass) throw new NotFoundException('Clase no encontrada');
    return klass;
  }

  async update(id: string, dto: UpdateCohorteClassDto): Promise<CohorteClass> {
    const klass = await this.findOne(id);
    Object.assign(klass, dto);
    return this.classRepo.save(klass);
  }

  async remove(id: string): Promise<void> {
    const klass = await this.findOne(id);
    await this.classRepo.remove(klass);
  }
}
