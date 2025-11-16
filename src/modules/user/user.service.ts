import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, IsNull, FindOptionsWhere } from 'typeorm';
import { User, UserStatus, UserRole } from './entities/user.entity';
import randomatic from 'randomatic';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../subscription/entities/subscription.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async create(data: Partial<User>): Promise<User> {
    const existingEmail = await this.userRepository.findOne({
      where: { email: data.email, deletedAt: IsNull() },
    });

    if (existingEmail) {
      throw new BadRequestException('Ya existe un usuario con ese correo');
    }

    if (data.username) {
      const existingUsername = await this.userRepository.findOne({
        where: { username: data.username, deletedAt: IsNull() },
      });

      if (existingUsername) {
        throw new BadRequestException('El nombre de usuario ya está en uso');
      }
    }

    // Crear usuario
    const userCreated = await this.userRepository.save(
      this.userRepository.create(data),
    );

    // Solo crear suscripción para usuarios tipo MEMBER
    if (userCreated.role === UserRole.MEMBER) {
      let existing = await this.subscriptionRepository.findOne({
        where: { userId: userCreated.id },
      });

      if (!existing) {
        const subscription = this.subscriptionRepository.create({
          userId: userCreated.id,
          plan: SubscriptionPlan.BRONCE,
          status: SubscriptionStatus.ACTIVE,
          startDate: new Date(),
          endDate: null,
        });

        await this.subscriptionRepository.save(subscription);
        console.log('🆕 Suscripción creada para usuario ID:', userCreated.id);
      }
    }
    console.log('🆕 Usuario creado →', userCreated.id);

    // Devolver usuario final
    return userCreated;
  }

  async findAll(
    page = 1,
    limit = 10,
    filters?: { name?: string; role?: UserRole; status?: UserStatus },
  ): Promise<{ data: User[]; total: number }> {
    const where: FindOptionsWhere<User> = { deletedAt: IsNull() };
    if (filters?.name) where.name = ILike(`%${filters.name}%`);
    if (filters?.role) where.role = filters.role;
    if (filters?.status) where.status = filters.status;

    const [data, total] = await this.userRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  // async findAllWithFilters(filterDto: FilterUsersDto) {
  //   const {
  //     page = 1,
  //     limit = 20,
  //     search,
  //     userType,
  //     status,
  //     location,
  //     sortBy,
  //     order,
  //   } = filterDto;

  //   const skip = (page - 1) * limit;

  //   const queryBuilder = this.userRepository
  //     .createQueryBuilder('user')
  //     .select([
  //       'user.id',
  //       'user.email',
  //       'user.username',
  //       'user.name',
  //       'user.lastName',
  //       'user.profilePicture',
  //       'user.coverPicture',
  //       'user.biography',
  //       'user.location',
  //       'user.website',
  //       'user.joinDate',
  //       'user.role',
  //       'user.status',
  //       'user.createdAt',
  //     ]);

  //   // FILTRO 1: Búsqueda por nombre, apellido, username o email
  //   if (search) {
  //     queryBuilder.andWhere(
  //       '(user.name ILIKE :search OR user.lastName ILIKE :search OR user.username ILIKE :search OR user.email ILIKE :search)',
  //       { search: `%${search}%` },
  //     );
  //   }

  //   // FILTRO 2: Por tipo de usuario
  //   if (userType) {
  //     queryBuilder.andWhere('user.role = :userType', { userType }); // Cambiar el filter-users-dto para usar role en vez de userType, como en la entidad (Recomendado)
  //   }

  //   // FILTRO 3: Por estado
  //   if (status) {
  //     queryBuilder.andWhere('user.status = :status', { status });
  //   }

  //   // FILTRO 4: Por ubicación
  //   if (location) {
  //     queryBuilder.andWhere('user.location ILIKE :location', {
  //       location: `%${location}%`,
  //     });
  //   }

  //   // ORDENAMIENTO
  //   queryBuilder.orderBy(`user.${sortBy}`, order);

  //   // PAGINACIÓN
  //   queryBuilder.skip(skip).take(limit);

  //   const [users, total] = await queryBuilder.getManyAndCount();

  //   return {
  //     data: users,
  //     meta: {
  //       page,
  //       limit,
  //       total,
  //       totalPages: Math.ceil(total / limit),
  //       filters: {
  //         search: search || null,
  //         userType: userType || null,
  //         status: status || null,
  //         location: location || null,
  //       },
  //     },
  //   };
  // }

  async findOne(id: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId: id },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return {
      user,
      plan: subscription?.plan,
      endDate: subscription?.endDate,
      nextBilling: subscription?.nextBillingDate,
    };
  }

  async findOneByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email, deletedAt: IsNull() },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
  async findOneByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { username, deletedAt: IsNull() },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    const validData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined),
    );
    Object.assign(user, validData);
    return await this.userRepository.save(user);
  }

  async updateByEmail(email: string, data: Partial<User>): Promise<User> {
    const user = await this.findOneByEmail(email);
    const validData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined),
    );
    Object.assign(user, validData);
    return await this.userRepository.save(user);
  }

  async updateByUsername(username: string, data: Partial<User>): Promise<User> {
    const user = await this.findOneByUsername(username);
    const validData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined),
    );
    Object.assign(user, validData);
    return await this.userRepository.save(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findOne(userId);
    const validData = Object.fromEntries(
      Object.entries(dto).filter(
        ([key, value]) => value !== undefined && key !== 'password',
      ),
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
    if (result.affected === 0)
      throw new NotFoundException('Usuario no encontrado o no eliminado');
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
    if (!user) throw new NotFoundException('Usuario no encontrado');
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

  async findUserByUsernameWithPassword(username: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { username, deletedAt: IsNull() },
      select: ['id', 'email', 'password', 'name', 'lastName', 'role'],
    });
    return user;
  }

  async findOrAddUser(user: User): Promise<User> {
    const userExist = await this.userRepository.findOne({
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
