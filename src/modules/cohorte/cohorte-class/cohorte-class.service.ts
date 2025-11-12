import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CohorteClass } from './entities/cohorte-class.entity';
import { ClassAttendance } from './entities/class-attendance.entity';
import { CreateCohorteClassDto } from './dto/create-cohorte-class.dto';
import { UpdateCohorteClassDto } from './dto/update-cohorte-class.dto';
import { Cohorte } from '../cohorte/entities/cohorte.entity';
import { User } from '../../user/entities/user.entity';

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
  ) {}

  async create(dto: CreateCohorteClassDto): Promise<CohorteClass> {
    const cohorte = await this.cohorteRepo.findOne({
      where: { id: dto.cohorteId },
    });
    if (!cohorte) throw new NotFoundException('Cohorte no encontrada');

    const teacher = dto.teacherId
      ? await this.userRepo.findOne({ where: { id: dto.teacherId } })
      : null;

    const newClass = this.classRepo.create({
      ...dto,
      cohorte,
      teacher,
    });

    const saved = await this.classRepo.save(newClass);

    // generar listas automáticas para ambos tipos (stand_up y hands_on)
    await this.attendanceService.generateForClass(saved.id, cohorte.id);

    return saved;
  }

  findAll(): Promise<CohorteClass[]> {
    return this.classRepo.find({ relations: ['cohorte', 'teacher'] });
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
