import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CohorteClassService } from './cohorte-class.service';
import { AttendanceService } from './attendance.service';
import { CreateCohorteClassDto } from './dto/create-cohorte-class.dto';
import { UpdateCohorteClassDto } from './dto/update-cohorte-class.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { AuthProtected } from '../../auth/decorator/auth-protected.decorator';
import { Roles } from '../../auth/decorator/roles.decorator';
import { RolesGuard } from '../../auth/guard/roles.guard';
import { UserRole } from '../../user/entities/user.entity';
import { Request } from 'express';
import { CohorteClassDocs } from '../docs/cohorte-class.docs';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ClassResponseDto } from '../docs';

@CohorteClassDocs.tag()
@CohorteClassDocs.auth()
@Controller('cohorte-classes')
@UseGuards(RolesGuard)
export class CohorteClassController {
  constructor(
    private readonly classService: CohorteClassService,
    private readonly attendanceService: AttendanceService,
  ) {}

  @Post()
  @AuthProtected()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @CohorteClassDocs.create.summary()
  @CohorteClassDocs.create.body()
  @CohorteClassDocs.create.created()
  @CohorteClassDocs.create.badRequest()
  create(@Body() dto: CreateCohorteClassDto) {
    return this.classService.create(dto);
  }

  @Get()
  @AuthProtected()
  @CohorteClassDocs.findAll.summary()
  @CohorteClassDocs.findAll.ok()
  findAll() {
    return this.classService.findAll();
  }

  @Get('by-cohorte/:cohorteId')
  @AuthProtected()
  // @CohorteClassDocs.findAllbyCohort.summary()
  // @CohorteClassDocs.findAllbyCohort.param()
  // @CohorteClassDocs.findAllbyCohort.ok()
  // @CohorteClassDocs.findAllbyCohort.notFound()
  @ApiOperation({
    summary: 'Obtener todas las clases de una cohorte',
    description:
      'Retorna todas las clases asociadas a una cohorte específica, ordenadas por fecha programada de forma descendente.',
    operationId: 'getClassesByCohort',
  })
  @ApiParam({
    name: 'cohorteId',
    type: 'string',
    format: 'uuid',
    description: 'ID de la cohorte',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Lista de clases de la cohorte obtenida exitosamente',
    type: [ClassResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'No se encontraron clases para la cohorte',
    schema: {
      example: {
        statusCode: 404,
        message:
          'No se encontraron clases para la cohorte 550e8400-e29b-41d4-a716-446655440000',
        error: 'Not Found',
      },
    },
  })
  findAllbyCohort(@Param('cohorteId') cohorteId: string) {
    return this.classService.findAllbyCohort(cohorteId);
  }

  @Get(':id')
  @AuthProtected()
  @CohorteClassDocs.findOne.summary()
  @CohorteClassDocs.findOne.param()
  @CohorteClassDocs.findOne.ok()
  @CohorteClassDocs.findOne.notFound()
  findOne(@Param('id') id: string) {
    return this.classService.findOne(id);
  }

  @Patch(':id')
  @AuthProtected()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @CohorteClassDocs.update.summary()
  @CohorteClassDocs.update.param()
  @CohorteClassDocs.update.body()
  @CohorteClassDocs.update.ok()
  @CohorteClassDocs.update.badRequest()
  @CohorteClassDocs.update.notFound()
  update(@Param('id') id: string, @Body() dto: UpdateCohorteClassDto) {
    return this.classService.update(id, dto);
  }

  @Delete(':id')
  @AuthProtected()
  @Roles(UserRole.ADMIN)
  @CohorteClassDocs.remove.summary()
  @CohorteClassDocs.remove.param()
  @CohorteClassDocs.remove.noContent()
  @CohorteClassDocs.remove.notFound()
  remove(@Param('id') id: string) {
    return this.classService.remove(id);
  }

  @Post(':id/attendance')
  @AuthProtected()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @CohorteClassDocs.attendance.markSummary()
  @CohorteClassDocs.attendance.markParam()
  @CohorteClassDocs.attendance.markBody()
  @CohorteClassDocs.attendance.ok()
  @CohorteClassDocs.attendance.badRequest()
  @CohorteClassDocs.attendance.forbidden()
  markAttendance(
    @Param('id') classId: string,
    @Body() dto: MarkAttendanceDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.attendanceService.markAttendance(classId, dto, req.user.id);
  }

  @Get(':id/attendance')
  @AuthProtected()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @CohorteClassDocs.attendance.classSummary()
  @CohorteClassDocs.attendance.classParam()
  @CohorteClassDocs.attendance.classOk()
  @CohorteClassDocs.attendance.notFound()
  getClassAttendance(@Param('id') classId: string) {
    return this.attendanceService.getClassAttendance(classId);
  }

  @Get('cohorte/:cohorteId/student/:studentId')
  @AuthProtected()
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.MEMBER)
  @CohorteClassDocs.attendance.studentSummary()
  @CohorteClassDocs.attendance.studentCohorteParam()
  @CohorteClassDocs.attendance.studentIdParam()
  @CohorteClassDocs.attendance.studentOk()
  @CohorteClassDocs.attendance.notFound()
  getStudentAttendance(
    @Param('cohorteId') cohorteId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.attendanceService.getStudentAttendance(cohorteId, studentId);
  }
}
