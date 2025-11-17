import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cohorte } from './entities/cohorte.entity';
import { CohorteMember } from './entities/cohorte-member.entity';
import { CreateCohorteDto } from './dto/create-cohorte.dto';
import { UpdateCohorteDto } from './dto/update-cohorte.dto';
import { User } from '../../user/entities/user.entity';
import { CohorteRoleEnum } from './enums/cohorte.enums';

@Injectable()
export class CohorteService {
  constructor(
    @InjectRepository(Cohorte)
    private readonly cohorteRepo: Repository<Cohorte>,

    @InjectRepository(CohorteMember)
    private readonly memberRepo: Repository<CohorteMember>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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

    return this.memberRepo.save(member);
  }

  //  Remover miembro
  async removeMember(cohorteId: string, userId: string): Promise<void> {
    const member = await this.memberRepo.findOne({
      where: { cohorte: { id: cohorteId }, user: { id: userId } },
    });

    if (!member) throw new NotFoundException('Miembro no encontrado');
    await this.memberRepo.remove(member);
  }
}
