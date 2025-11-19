import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { CohorteService } from './cohorte.service';
import { CreateCohorteDto } from './dto/create-cohorte.dto';
import { UpdateCohorteDto } from './dto/update-cohorte.dto';
import { AuthProtected } from '../../auth/decorator/auth-protected.decorator';
import { Roles } from '../../auth/decorator/roles.decorator';
import { UserRole } from '../../user/entities/user.entity';
import { RolesGuard } from '../../auth/guard/roles.guard';
import { CohorteRoleEnum } from './enums/cohorte.enums';

import { CohorteDocs } from '../docs/cohorte.docs';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import {
  ApiGetMyCohortes,
  ApiGetMyCohorteAsTeacher,
  ApiGetMyCohortesAsStudent,
} from '../docs/cohorte.docs';

@CohorteDocs.tag()
@CohorteDocs.auth()
@Controller('cohortes')
@UseGuards(RolesGuard)
export class CohorteController {
  constructor(private readonly cohorteService: CohorteService) {}

  @Post()
  @AuthProtected()
  @Roles(UserRole.ADMIN)
  @CohorteDocs.create.summary()
  @CohorteDocs.create.body()
  @CohorteDocs.create.created()
  @CohorteDocs.create.badRequest()
  create(@Body() dto: CreateCohorteDto) {
    return this.cohorteService.create(dto);
  }

  @Get()
  @AuthProtected()
  @CohorteDocs.findAll.summary()
  @CohorteDocs.findAll.ok()
  findAll() {
    return this.cohorteService.findAll();
  }

  @Get(':id')
  @AuthProtected()
  @CohorteDocs.findOne.summary()
  @CohorteDocs.findOne.param()
  @CohorteDocs.findOne.ok()
  @CohorteDocs.findOne.notFound()
  findOne(@Param('id') id: string) {
    return this.cohorteService.findOne(id);
  }

  @Patch(':id')
  @AuthProtected()
  @Roles(UserRole.ADMIN)
  @CohorteDocs.update.summary()
  @CohorteDocs.update.param()
  @CohorteDocs.update.body()
  @CohorteDocs.update.ok()
  @CohorteDocs.update.badRequest()
  @CohorteDocs.update.notFound()
  update(@Param('id') id: string, @Body() dto: UpdateCohorteDto) {
    return this.cohorteService.update(id, dto);
  }

  @Delete(':id')
  @AuthProtected()
  @Roles(UserRole.ADMIN)
  @CohorteDocs.remove.summary()
  @CohorteDocs.remove.param()
  @CohorteDocs.remove.noContent()
  @CohorteDocs.remove.notFound()
  remove(@Param('id') id: string) {
    return this.cohorteService.remove(id);
  }

  @Post(':id/members/:userId')
  @AuthProtected()
  @Roles(UserRole.ADMIN)
  @CohorteDocs.members.addSummary()
  @applyDecorators(...CohorteDocs.members.addParam())
  @CohorteDocs.members.addBody()
  @CohorteDocs.members.created()
  @CohorteDocs.members.memberAlreadyExists()
  @CohorteDocs.members.memberNotFound()
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
  @CohorteDocs.members.removeSummary()
  @applyDecorators(...CohorteDocs.members.removeParam())
  @CohorteDocs.members.noContent()
  @CohorteDocs.members.memberRemoveNotFound()
  removeMember(
    @Param('id') cohorteId: string,
    @Param('userId') userId: string,
  ) {
    return this.cohorteService.removeMember(cohorteId, userId);
  }

  // ============================================
  // MIS COHORTES (ACTIVAS E INACTIVAS)
  // ============================================
  @Get('me')
  @AuthProtected()
  @Roles(UserRole.ADMIN, UserRole.MEMBER, UserRole.TEACHER)
  @ApiGetMyCohortes()
  async getMyCohortes(@CurrentUser('id') userId: string) {
    return this.cohorteService.getMyCohortes(userId);
  }

  // ============================================
  // MIS COHORTES COMO PROFESOR (OPCIONAL)
  // ============================================
  @Get('me/teaching')
  @AuthProtected()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiGetMyCohorteAsTeacher()
  async getMyCohorteAsTeacher(@CurrentUser('id') userId: string) {
    return this.cohorteService.getMyCohorteAsTeacher(userId);
  }

  // ============================================
  // MIS COHORTES COMO ESTUDIANTE (OPCIONAL)
  // ============================================
  @Get('me/studying')
  @AuthProtected()
  @Roles(UserRole.ADMIN, UserRole.MEMBER)
  @ApiGetMyCohortesAsStudent()
  async getMyCohortesAsStudent(@CurrentUser('id') userId: string) {
    return this.cohorteService.getMyCohortesAsStudent(userId);
  }
}
