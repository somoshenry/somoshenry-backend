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
import { AuthProtected } from '../../auth/decorator/auth-protected.decorator';
import { Roles } from '../../auth/decorator/roles.decorator';
import { RolesGuard } from '../../auth/guard/roles.guard';
import { UserRole } from '../../user/entities/user.entity';
import { Request } from 'express';

import { CreateCohorteAnnouncementDto } from './dto/create-cohorte-announcement.dto';

// Docs
import { AnnouncementDocs } from '../docs/cohorte-announcement.docs';

@AnnouncementDocs.tag()
@AnnouncementDocs.auth()
@Controller('cohortes')
@UseGuards(RolesGuard)
export class CohorteAnnouncementController {
  constructor(private readonly service: CohorteAnnouncementService) {}

  // CREATE
  @Post(':id/announcements')
  @AuthProtected()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @AnnouncementDocs.create.summary()
  @AnnouncementDocs.create.created()
  @AnnouncementDocs.create.forbidden()
  @AnnouncementDocs.create.badRequest()
  create(
    @Param('id') cohorteId: string,
    @Body() dto: CreateCohorteAnnouncementDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    dto.cohorteId = cohorteId;
    return this.service.create(dto, req.user.id);
  }

  // FIND ALL
  @Get(':id/announcements')
  @AuthProtected()
  @AnnouncementDocs.findAll.summary()
  @AnnouncementDocs.findAll.ok()
  @AnnouncementDocs.findAll.notFound()
  findAll(@Param('id') cohorteId: string) {
    return this.service.findByCohorte(cohorteId);
  }

  // DELETE
  @Delete('announcements/:id')
  @AuthProtected()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @AnnouncementDocs.remove.summary()
  @AnnouncementDocs.remove.noContent()
  @AnnouncementDocs.remove.forbidden()
  @AnnouncementDocs.remove.notFound()
  remove(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.service.remove(id, req.user.id);
  }

  // PIN / UNPIN
  @Patch('announcements/:id/pin')
  @AuthProtected()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @AnnouncementDocs.pin.summary()
  @AnnouncementDocs.pin.ok()
  @AnnouncementDocs.pin.forbidden()
  @AnnouncementDocs.pin.notFound()
  togglePin(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.service.togglePin(id, req.user.id);
  }
}
