import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  applyDecorators,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { ForbiddenException } from '@nestjs/common';
import { UserService } from './user.service';

import { UpdateUserDto } from './dto/update-user.dto';
import { SwaggerUserDocs } from './docs/user.swagger';
import { UserStatus, UserRole } from './entities/user.entity';
import { AuthProtected } from '../auth/decorator/auth-protected.decorator';

@ApiTags('User')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @AuthProtected()
  @applyDecorators(...SwaggerUserDocs.me)
  async getProfile(@Req() req: Request & { user: { id: string } }) {
    const user = await this.userService.findOne(req.user.id);
    return { message: 'Perfil del usuario', user };
  }
  @Get()
  @AuthProtected(UserRole.TEACHER, UserRole.ADMIN)
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
  ) {
    const filters = { name, role, status };
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

  @Get(':id')
  @AuthProtected(UserRole.TEACHER, UserRole.ADMIN)
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
