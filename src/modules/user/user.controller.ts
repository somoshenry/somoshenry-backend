import { Controller, Get, Post, Patch, Delete, Param, Body, applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SwaggerUserDocs } from './docs/user.swagger';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @applyDecorators(...SwaggerUserDocs.create)
  async create(@Body() dto: CreateUserDto) {
    const user = await this.userService.create(dto);
    return { message: 'Usuario creado exitosamente', user };
  }

  @Get()
  @applyDecorators(...SwaggerUserDocs.findAll)
  async findAll() {
    const users = await this.userService.findAll();
    return { message: 'Lista de usuarios obtenida correctamente', users };
  }

  @Get(':id')
  @applyDecorators(...SwaggerUserDocs.findOne)
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findOne(id);
    return { message: 'Usuario encontrado', user };
  }

  @Patch(':id')
  @applyDecorators(...SwaggerUserDocs.update)
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const updated = await this.userService.update(id, dto);
    return { message: 'Usuario actualizado correctamente', user: updated };
  }

  @Delete(':id')
  @applyDecorators(...SwaggerUserDocs.delete)
  async delete(@Param('id') id: string) {
    return await this.userService.delete(id);
  }
}
