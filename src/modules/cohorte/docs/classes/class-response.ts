import { ApiProperty } from '@nestjs/swagger';
import { ClassStatusEnum } from '../../cohorte/enums/cohorte.enums';

export class ClassTeacherDto {
  @ApiProperty({
    description: 'ID del profesor',
    example: '550e8400-e29b-41d4-a716-446655440002',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre completo del profesor',
    example: 'María García',
  })
  fullName: string;

  @ApiProperty({
    description: 'Correo electrónico del profesor',
    example: 'maria.garcia@example.com',
  })
  email: string;
}

export class ClassResponseDto {
  @ApiProperty({
    description: 'ID único de la clase',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'ID de la cohorte',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  cohorteId: string;

  @ApiProperty({
    description: 'Nombre de la clase',
    example: 'Introducción a TypeScript',
    maxLength: 200,
  })
  name: string;

  @ApiProperty({
    description: 'Descripción de la clase',
    example: 'En esta clase aprenderemos los conceptos básicos de TypeScript',
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    description: 'Módulo al que pertenece',
    example: 'Fundamentos',
    nullable: true,
  })
  module?: string;

  @ApiProperty({
    description: 'Fecha y hora programada',
    example: '2025-02-15T14:00:00Z',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  scheduledDate?: Date;

  @ApiProperty({
    description: 'Duración en minutos',
    example: 90,
    type: 'integer',
    nullable: true,
  })
  duration?: number;

  @ApiProperty({
    description: 'Información del profesor asignado',
    type: ClassTeacherDto,
    nullable: true,
  })
  teacher?: ClassTeacherDto;

  @ApiProperty({
    description: 'URL de la reunión',
    example: 'https://meet.google.com/abc-defg-hij',
    nullable: true,
  })
  meetingUrl?: string;

  @ApiProperty({
    description: 'URL de la grabación',
    example: 'https://drive.google.com/file/d/...',
    nullable: true,
  })
  recordingUrl?: string;

  @ApiProperty({
    description: 'URL de materiales',
    example: 'https://example.com/materials',
    nullable: true,
  })
  materialsUrl?: string;

  @ApiProperty({
    description: 'Estado de la clase',
    enum: ClassStatusEnum,
    example: ClassStatusEnum.SCHEDULED,
  })
  status: ClassStatusEnum;

  @ApiProperty({
    description: 'ID de la sala RTC',
    example: 'room-123456',
    nullable: true,
  })
  rtcRoomId?: string;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2025-01-15T10:30:00Z',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2025-01-15T11:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  updatedAt: Date;
}

export class AttendanceRecordDto {
  @ApiProperty({
    description: 'ID del estudiante',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  studentId: string;

  @ApiProperty({
    description: 'Nombre del estudiante',
    example: 'Carlos López',
  })
  studentName: string;

  @ApiProperty({
    description: 'Estado de asistencia',
    enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'],
    example: 'PRESENT',
  })
  status: string;

  @ApiProperty({
    description: 'Notas adicionales sobre la asistencia',
    example: 'Llegó 15 minutos tarde',
    nullable: true,
  })
  notes?: string;
}

export class ClassAttendanceResponseDto {
  @ApiProperty({
    description: 'ID de la clase',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  classId: string;

  @ApiProperty({
    description: 'Nombre de la clase',
    example: 'Introducción a TypeScript',
  })
  className: string;

  @ApiProperty({
    description: 'Fecha de la clase',
    example: '2025-02-15T14:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  scheduledDate: Date;

  @ApiProperty({
    description: 'Cantidad total de registros de asistencia',
    example: 25,
    type: 'integer',
  })
  totalRecords: number;

  @ApiProperty({
    description: 'Registros de asistencia individuales',
    type: [AttendanceRecordDto],
  })
  attendance: AttendanceRecordDto[];
}

export class StudentAttendanceResponseDto {
  @ApiProperty({
    description: 'ID del estudiante',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  studentId: string;

  @ApiProperty({
    description: 'Nombre del estudiante',
    example: 'Carlos López',
  })
  studentName: string;

  @ApiProperty({
    description: 'ID de la cohorte',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  cohorteId: string;

  @ApiProperty({
    description: 'Porcentaje total de asistencia',
    example: 92.5,
    type: 'number',
  })
  attendancePercentage: number;

  @ApiProperty({
    description: 'Total de clases asistidas',
    example: 37,
    type: 'integer',
  })
  classesAttended: number;

  @ApiProperty({
    description: 'Total de clases tardío',
    example: 3,
    type: 'integer',
  })
  classesLate: number;

  @ApiProperty({
    description: 'Total de clases ausente',
    example: 2,
    type: 'integer',
  })
  classesAbsent: number;

  @ApiProperty({
    description: 'Total de clases excusado',
    example: 1,
    type: 'integer',
  })
  classesExcused: number;

  @ApiProperty({
    description: 'Total de clases programadas',
    example: 40,
    type: 'integer',
  })
  totalClasses: number;
}
