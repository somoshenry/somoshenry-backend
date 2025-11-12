import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CohorteAnnouncementService } from './cohorte-announcement.service';
import { CreateCohorteAnnouncementDto } from './dto/create-cohorte-announcement.dto';
import { AuthProtected } from '../../auth/decorator/auth-protected.decorator';
import { Roles } from '../../auth/decorator/roles.decorator';
import { RolesGuard } from '../../auth/guard/roles.guard';
import { UserRole } from '../../user/entities/user.entity';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { Request } from 'express';

@ApiTags('Cohorte Announcements')
@Controller('cohortes')
@UseGuards(RolesGuard)
export class CohorteAnnouncementController {
  constructor(private readonly service: CohorteAnnouncementService) {}

  @Post(':id/announcements')
  @AuthProtected()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Crear anuncio para un cohorte (Teacher/Admin)' })
  create(
    @Param('id') cohorteId: string,
    @Body() dto: CreateCohorteAnnouncementDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    dto.cohorteId = cohorteId;
    return this.service.create(dto, req.user.id);
  }

  @Get(':id/announcements')
  @AuthProtected()
  @ApiOperation({ summary: 'Ver todos los anuncios de un cohorte' })
  findAll(@Param('id') cohorteId: string) {
    return this.service.findByCohorte(cohorteId);
  }

  @Delete('announcements/:id')
  @AuthProtected()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Eliminar anuncio propio (Teacher/Admin)' })
  remove(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.service.remove(id, req.user.id);
  }

  @Patch('announcements/:id/pin')
  @AuthProtected()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Fijar o desfijar un anuncio (Teacher/Admin)' })
  togglePin(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.service.togglePin(id, req.user.id);
  }
}
