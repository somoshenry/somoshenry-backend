import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { Request } from 'express';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { UserService } from './user.service';

import { UpdateUserDto } from './dto/update-user.dto';
import { SwaggerUserDocs } from './docs/user.swagger';
import { EstadoUsuario, TipoUsuario } from './entities/user.entity';

@ApiTags('Usuarios')
@Controller('usuarios')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @applyDecorators(...SwaggerUserDocs.me)
  async getProfile(@Req() req: Request & { user: { id: string } }) {
    const user = await this.userService.findOne(req.user.id);
    return { message: 'Perfil del usuario', user };
  }

  // @Post()
  // @applyDecorators(...SwaggerUserDocs.create)
  // async create(@Body() dto: CreateUserDto) {
  //   const user = await this.userService.create(dto);
  //   return { message: 'Usuario creado exitosamente', user };
  // }

  @Get()
  @UseGuards(JwtAuthGuard)
  @applyDecorators(...SwaggerUserDocs.findAll)
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'nombre', required: false })
  @ApiQuery({ name: 'tipo', required: false, enum: TipoUsuario })
  @ApiQuery({ name: 'estado', required: false, enum: EstadoUsuario })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('nombre') nombre?: string,
    @Query('tipo') tipo?: TipoUsuario,
    @Query('estado') estado?: EstadoUsuario,
  ) {
    const filters = { nombre, tipo, estado };
    const { data, total } = await this.userService.findAll(
      +page,
      +limit,
      filters,
    );
    return {
      message: 'Lista de usuarios obtenida correctamente',
      total,
      usuarios: data,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @applyDecorators(...SwaggerUserDocs.findOne)
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findOne(id);
    return { message: 'Usuario encontrado', user };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @applyDecorators(...SwaggerUserDocs.update)
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const updated = await this.userService.update(id, dto);
    return { message: 'Usuario actualizado correctamente', user: updated };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @applyDecorators(...SwaggerUserDocs.delete)
  async softDelete(@Param('id') id: string) {
    const result = await this.userService.softDelete(id);
    return result;
  }

  @Patch('restore/:id')
  @UseGuards(JwtAuthGuard)
  @applyDecorators(...SwaggerUserDocs.restore)
  async restore(@Param('id') id: string) {
    const result = await this.userService.restore(id);
    return result;
  }

  @Delete('hard/:id')
  @UseGuards(JwtAuthGuard)
  @applyDecorators(...SwaggerUserDocs.hardDelete)
  async hardDelete(
    @Param('id') id: string,
    @Req() req: Request & { user?: { tipo: TipoUsuario } },
  ) {
    const userRole = req.user?.tipo || TipoUsuario.ADMINISTRADOR;

    const result = await this.userService.hardDelete(id, userRole);
    return result;
  }
}
