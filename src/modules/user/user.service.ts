import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, IsNull, FindOptionsWhere } from 'typeorm';
import { User, UserStatus, UserRole } from './entities/user.entity';
import randomatic from 'randomatic';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create(data);
    return await this.userRepository.save(user);
  }

  async findAll(
    page = 1,
    limit = 10,
    filters?: { name?: string; role?: UserRole; status?: UserStatus },
  ): Promise<{ data: User[]; total: number }> {
    const where: FindOptionsWhere<User> = {
      deletedAt: IsNull(),
    };

    if (filters?.name) {
      where.name = ILike(`%${filters.name}%`);
    }

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const [data, total] = await this.userRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async findOneByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email, deletedAt: IsNull() },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findOne(id);

    const validData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined),
    );

    Object.assign(user, validData);

    return await this.userRepository.save(user);
  }

  async updateByEmail(email: string, data: Partial<User>): Promise<User> {
    const user = await this.findOneByEmail(email);

    const validData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined),
    );

    Object.assign(user, validData);

    return await this.userRepository.save(user);
  }

  async softDelete(id: string): Promise<{ message: string }> {
    const user = await this.findOne(id);

    user.status = UserStatus.DELETED;
    await this.userRepository.save(user);
    await this.userRepository.softDelete(id);

    return { message: 'Usuario marcado como eliminado (soft delete)' };
  }

  async restore(id: string): Promise<{ message: string }> {
    const result = await this.userRepository.restore(id);

    if (result.affected === 0) {
      throw new NotFoundException('Usuario no encontrado o no eliminado');
    }

    await this.userRepository.update(id, { status: UserStatus.ACTIVE });

    return { message: 'Usuario restaurado correctamente' };
  }

  async hardDelete(
    id: string,
    userRole: UserRole,
  ): Promise<{ message: string }> {
    if (userRole !== UserRole.ADMIN) {
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

  async findUserByEmailWithPassword(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email, deletedAt: IsNull() },
      select: ['id', 'email', 'password', 'name', 'lastName', 'role'],
    });
    return user;
  }

  async findOrAddUser(user: User): Promise<User> {
    const userExist = await await this.userRepository.findOne({
      where: { email: user.email },
    });
    if (userExist) return userExist;
    user.password = this.generatePassword();
    user.role = UserRole.MEMBER;
    return await this.create(user);
  }

  private generatePassword(): string {
    return randomatic('Aa0!', 12);
  }
}
