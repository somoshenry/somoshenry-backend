import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CohorteClassService } from './cohorte-class.service';
import { CreateCohorteClassDto } from './dto/create-cohorte-class.dto';
import { UpdateCohorteClassDto } from './dto/update-cohorte-class.dto';
import { AuthProtected } from '../../auth/decorator/auth-protected.decorator';
import { Roles } from '../../auth/decorator/roles.decorator';
import { RolesGuard } from '../../auth/guard/roles.guard';
import { UserRole } from '../../user/entities/user.entity';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { AttendanceTypeEnum } from '../cohorte/enums/cohorte.enums';

@ApiTags('Cohorte Classes')
@Controller('cohorte-classes')
@UseGuards(RolesGuard)
export class CohorteClassController {
  constructor(private readonly classService: CohorteClassService) {}

  @Post()
  @AuthProtected()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Crear clase (ADMIN o TEACHER)' })
  create(@Body() dto: CreateCohorteClassDto) {
    return this.classService.create(dto);
  }

  @Get()
  @AuthProtected()
  @ApiOperation({ summary: 'Listar todas las clases' })
  findAll() {
    return this.classService.findAll();
  }

  @Get(':id')
  @AuthProtected()
  @ApiOperation({ summary: 'Obtener clase por ID' })
  findOne(@Param('id') id: string) {
    return this.classService.findOne(id);
  }

  @Patch(':id')
  @AuthProtected()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Actualizar clase (ADMIN o TEACHER)' })
  update(@Param('id') id: string, @Body() dto: UpdateCohorteClassDto) {
    return this.classService.update(id, dto);
  }

  @Delete(':id')
  @AuthProtected()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar clase (solo ADMIN)' })
  remove(@Param('id') id: string) {
    return this.classService.remove(id);
  }

  @Post(':id/attendance')
  @AuthProtected()
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.TA)
  @ApiOperation({
    summary:
      'Marcar asistencia masiva (STAND_UP por TA / HANDS_ON por Teacher)',
  })
  async markAttendance(
    @Param('id') classId: string,
    @Body() dto: MarkAttendanceDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.attendanceService.markAttendance(classId, dto, req.user.id);
  }

  @Get(':id/attendance')
  @AuthProtected()
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.TA)
  @ApiOperation({ summary: 'Obtener asistencia de la clase (ambos tipos)' })
  getClassAttendance(@Param('id') classId: string) {
    return this.attendanceService.getClassAttendance(classId);
  }

  @Get('cohorte/:cohorteId/attendance/student/:studentId')
  @AuthProtected()
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.TA, UserRole.STUDENT)
  @ApiOperation({
    summary: 'Obtener asistencia de un alumno dentro de la cohorte',
  })
  getStudentAttendance(
    @Param('cohorteId') cohorteId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.attendanceService.getStudentAttendance(cohorteId, studentId);
  }
}
