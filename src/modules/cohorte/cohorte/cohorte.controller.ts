import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CohorteService } from './cohorte.service';
import { CreateCohorteDto } from './dto/create-cohorte.dto';
import { UpdateCohorteDto } from './dto/update-cohorte.dto';
import { AuthProtected } from '../../auth/decorator/auth-protected.decorator';
import { Roles } from '../../auth/decorator/roles.decorator';
import { UserRole } from '../../user/entities/user.entity';
import { RolesGuard } from '../../auth/guard/roles.guard';
import { CohorteRoleEnum } from './enums/cohorte.enums';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Cohortes')
@Controller('cohortes')
@UseGuards(RolesGuard)
export class CohorteController {
  constructor(private readonly cohorteService: CohorteService) {}

  @Post()
  @AuthProtected()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear una nueva cohorte (solo ADMIN)' })
  create(@Body() dto: CreateCohorteDto) {
    return this.cohorteService.create(dto);
  }

  @Get()
  @AuthProtected()
  @ApiOperation({ summary: 'Obtener todas las cohortes' })
  findAll() {
    return this.cohorteService.findAll();
  }

  @Get(':id')
  @AuthProtected()
  @ApiOperation({ summary: 'Obtener cohorte por ID' })
  findOne(@Param('id') id: string) {
    return this.cohorteService.findOne(id);
  }

  @Patch(':id')
  @AuthProtected()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar cohorte (solo ADMIN)' })
  update(@Param('id') id: string, @Body() dto: UpdateCohorteDto) {
    return this.cohorteService.update(id, dto);
  }

  @Delete(':id')
  @AuthProtected()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar cohorte (solo ADMIN)' })
  remove(@Param('id') id: string) {
    return this.cohorteService.remove(id);
  }

  @Post(':id/members/:userId')
  @AuthProtected()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Agregar miembro a cohorte (solo ADMIN)' })
  addMember(
    @Param('id') cohorteId: string,
    @Param('userId') userId: string,
    @Body('role') role: CohorteRoleEnum,
  ) {
    return this.cohorteService.addMember(cohorteId, userId, role);
  }

  @Delete(':id/members/:userId')
  @AuthProtected()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover miembro de una cohorte (solo ADMIN)' })
  removeMember(
    @Param('id') cohorteId: string,
    @Param('userId') userId: string,
  ) {
    return this.cohorteService.removeMember(cohorteId, userId);
  }
}
