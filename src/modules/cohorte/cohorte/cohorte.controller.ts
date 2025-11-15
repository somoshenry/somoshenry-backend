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

// ⬅️ IMPORTAMOS TUS DOCS
import { CohorteDocs } from '../docs/cohorte.docs';

@CohorteDocs.tag()
@CohorteDocs.auth()
@Controller('cohortes')
@UseGuards(RolesGuard)
export class CohorteController {
  constructor(private readonly cohorteService: CohorteService) {}

  // =============================
  //        CREATE
  // =============================
  @Post()
  @AuthProtected()
  @Roles(UserRole.ADMIN)
  @CohorteDocs.create.summary()
  @CohorteDocs.create.created()
  @CohorteDocs.create.badRequest()
  create(@Body() dto: CreateCohorteDto) {
    return this.cohorteService.create(dto);
  }

  // =============================
  //        FIND ALL
  // =============================
  @Get()
  @AuthProtected()
  @CohorteDocs.findAll.summary()
  @CohorteDocs.findAll.ok()
  findAll() {
    return this.cohorteService.findAll();
  }

  // =============================
  //        FIND ONE
  // =============================
  @Get(':id')
  @AuthProtected()
  @CohorteDocs.findOne.summary()
  @CohorteDocs.findOne.ok()
  @CohorteDocs.findOne.notFound()
  findOne(@Param('id') id: string) {
    return this.cohorteService.findOne(id);
  }

  // =============================
  //        UPDATE
  // =============================
  @Patch(':id')
  @AuthProtected()
  @Roles(UserRole.ADMIN)
  @CohorteDocs.update.summary()
  @CohorteDocs.update.ok()
  @CohorteDocs.update.badRequest()
  @CohorteDocs.update.notFound()
  update(@Param('id') id: string, @Body() dto: UpdateCohorteDto) {
    return this.cohorteService.update(id, dto);
  }

  // =============================
  //        DELETE
  // =============================
  @Delete(':id')
  @AuthProtected()
  @Roles(UserRole.ADMIN)
  @CohorteDocs.remove.summary()
  @CohorteDocs.remove.noContent()
  @CohorteDocs.remove.notFound()
  remove(@Param('id') id: string) {
    return this.cohorteService.remove(id);
  }

  // =============================
  //     ADD MEMBER
  // =============================
  @Post(':id/members/:userId')
  @AuthProtected()
  @Roles(UserRole.ADMIN)
  @CohorteDocs.members.addSummary()
  @CohorteDocs.members.created()
  @CohorteDocs.members.notFound()
  addMember(
    @Param('id') cohorteId: string,
    @Param('userId') userId: string,
    @Body('role') role: CohorteRoleEnum,
  ) {
    return this.cohorteService.addMember(cohorteId, userId, role);
  }

  // =============================
  //     REMOVE MEMBER
  // =============================
  @Delete(':id/members/:userId')
  @AuthProtected()
  @Roles(UserRole.ADMIN)
  @CohorteDocs.members.removeSummary()
  @CohorteDocs.members.noContent()
  @CohorteDocs.members.notFound()
  removeMember(
    @Param('id') cohorteId: string,
    @Param('userId') userId: string,
  ) {
    return this.cohorteService.removeMember(cohorteId, userId);
  }
}
