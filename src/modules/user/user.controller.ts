import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  ForbiddenException,
  applyDecorators,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiQuery, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SwaggerUserDocs } from './docs/user.swagger';
import { UserStatus, UserRole, User } from './entities/user.entity';
import { AuthProtected } from '../auth/decorator/auth-protected.decorator';
import { FilterUsersDto } from './dto/filter-users.dto';
import { CurrentUser } from '../auth/decorator/current-user.decorator';

@ApiTags('User')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @AuthProtected()
  @applyDecorators(...SwaggerUserDocs.me)
  async getProfile(@Req() req: Request & { user: { id: string } }) {
    const user = await this.userService.findOne(req.user.id)
    return { message: 'Perfil del usuario', user };
  }

  @Patch('me')
  @AuthProtected()
  @applyDecorators(...SwaggerUserDocs.update)
  async updateProfile(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: UpdateProfileDto,
  ) {
    const userId = req.user.id;
    const updated = await this.userService.updateProfile(userId, dto);
    return { message: 'Perfil actualizado correctamente', user: updated };
  }

  @Get()
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @applyDecorators(...SwaggerUserDocs.findAll)
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'status', required: false, enum: UserStatus })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('name') name?: string,
    @Query('role') role?: UserRole,
    @Query('status') status?: UserStatus,
    @CurrentUser() user?: User, // Opcional para usuarios logueados
  ) {
    const filters = { name, role, status };

    // Validación de estado
    // Si no se proporciona un filtro de estado, excluye los suspendidos o eliminados
    if (!filters.status) {
      filters.status = UserStatus.ACTIVE;
    }

    // Si buscan por status SUSPENDED o DELETED, requerir admin
    if (
      filters.status === UserStatus.SUSPENDED ||
      filters.status === UserStatus.DELETED
    ) {
      if (!user || user.role !== UserRole.ADMIN) {
        throw new ForbiddenException(
          'Solo admins pueden ver usuarios suspendidos o eliminados',
        );
      }
    }

    // Llamada al servicio
    const { data, total } = await this.userService.findAll(
      +page,
      +limit,
      filters,
    );
    return {
      message: 'Lista de usuarios obtenida correctamente',
      total,
      users: data,
    };
  }

  // @Get()
  // @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  // @ApiOperation({
  //   summary: 'Buscar usuarios con filtros',
  //   description:
  //     'Permite buscar usuarios por nombre, email, tipo, estado, ubicación, etc.',
  // })
  // async findAll(
  //   @Query() filterDto: FilterUsersDto,
  //   @CurrentUser() user?: User, // Opcional para usuarios logueados
  // ) {
  //   // console.log('User:', user); // Agregar registro para depuración
  //   // console.log('Filter DTO:', filterDto); // Agregar registro para depuración

  // // Si no se proporciona un filtro de estado, excluye los usuarios suspendidos o eliminados
  // if (!filterDto.status) {
  //   filterDto.status = UserStatus.ACTIVE;
  // }
  // // Si buscan por status SUSPENDED o DELETED, requerir admin
  // if (
  //   filterDto.status === UserStatus.SUSPENDED ||
  //   filterDto.status === UserStatus.DELETED
  // ) {
  //   // console.log('User:', user); // Agregar registro para depuración
  //   if (!user || user.role !== UserRole.ADMIN) {
  //     throw new ForbiddenException(
  //       'Solo admins pueden ver usuarios suspendidos o eliminados',
  //     );
  //   }
  // }

  //   const result = await this.userService.findAllWithFilters(filterDto);

  //   return {
  //     message: 'Lista de usuarios obtenida correctamente',
  //     data: {
  //       users: result.data,
  //       pagination: {
  //         page: result.meta.page,
  //         limit: result.meta.limit,
  //         total: result.meta.total,
  //         totalPages: result.meta.totalPages,
  //       },
  //       filters: result.meta.filters,
  //     },
  //   };
  // }

  @Get(':id')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @applyDecorators(...SwaggerUserDocs.findOne)
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findOne(id);
    return { message: 'Usuario encontrado', user };
  }

  @Patch(':id')
  @AuthProtected(UserRole.ADMIN)
  @applyDecorators(...SwaggerUserDocs.update)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: Request & { user: { id: string; role: UserRole } },
  ) {
    if (req.user.id !== id && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'No tienes permisos para actualizar este usuario',
      );
    }
    const updated = await this.userService.update(id, dto);
    return { message: 'Usuario actualizado correctamente', user: updated };
  }

  @Delete(':id')
  @AuthProtected(UserRole.ADMIN)
  @applyDecorators(...SwaggerUserDocs.delete)
  async softDelete(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string; role: UserRole } },
  ) {
    if (req.user.id !== id && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar este usuario',
      );
    }
    const result = await this.userService.softDelete(id);
    return result;
  }

  @Patch('restore/:id')
  @AuthProtected(UserRole.ADMIN)
  @applyDecorators(...SwaggerUserDocs.restore)
  async restore(@Param('id') id: string) {
    const result = await this.userService.restore(id);
    return result;
  }

  @Delete('hard/:id')
  @AuthProtected(UserRole.ADMIN)
  @applyDecorators(...SwaggerUserDocs.hardDelete)
  async hardDelete(
    @Param('id') id: string,
    @Req() req: Request & { user?: { role: UserRole } },
  ) {
    const userRole = req.user?.role || UserRole.ADMIN;
    const result = await this.userService.hardDelete(id, userRole);
    return result;
  }
}
