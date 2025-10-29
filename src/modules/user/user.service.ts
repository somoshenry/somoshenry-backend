import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, IsNull } from 'typeorm';
import { Usuario, EstadoUsuario, TipoUsuario } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Usuario)
    private readonly userRepository: Repository<Usuario>,
  ) {}

  async create(data: Partial<Usuario>): Promise<Usuario> {
    const user = this.userRepository.create(data);
    return await this.userRepository.save(user);
  }

  async findAll(
    page = 1,
    limit = 10,
    filters?: { nombre?: string; tipo?: TipoUsuario; estado?: EstadoUsuario },
  ): Promise<{ data: Usuario[]; total: number }> {
    const where: any = { eliminadoEn: IsNull() };

    if (filters?.nombre) {
      where.nombre = ILike(`%${filters.nombre}%`);
    }

    if (filters?.tipo) {
      where.tipo = filters.tipo;
    }

    if (filters?.estado) {
      where.estado = filters.estado;
    }

    const [data, total] = await this.userRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { creadoEn: 'DESC' },
    });

    return { data, total };
  }

  async findOne(id: string): Promise<Usuario> {
    const user = await this.userRepository.findOne({
      where: { id, eliminadoEn: IsNull() },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async update(id: string, data: Partial<Usuario>): Promise<Usuario> {
    const user = await this.findOne(id);

    const validData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined),
    );

    Object.assign(user, validData);

    return await this.userRepository.save(user);
  }

  async softDelete(id: string): Promise<{ message: string }> {
    const user = await this.findOne(id);

    user.estado = EstadoUsuario.ELIMINADO;
    await this.userRepository.save(user);
    await this.userRepository.softDelete(id);

    return { message: 'Usuario marcado como eliminado (soft delete)' };
  }

  async restore(id: string): Promise<{ message: string }> {
    const result = await this.userRepository.restore(id);

    if (result.affected === 0) {
      throw new NotFoundException('Usuario no encontrado o no eliminado');
    }

    await this.userRepository.update(id, { estado: EstadoUsuario.ACTIVO });

    return { message: 'Usuario restaurado correctamente' };
  }

  async hardDelete(
    id: string,
    userRole: TipoUsuario,
  ): Promise<{ message: string }> {
    if (userRole !== TipoUsuario.ADMINISTRADOR) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar usuarios permanentemente',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.userRepository.remove(user);

    return { message: 'Usuario eliminado definitivamente de la base de datos' };
  }
}
