import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import {
  AttendanceStatusEnum,
  AttendanceTypeEnum,
} from '../../cohorte/enums/cohorte.enums';

export class AttendanceRecordRequestDto {
  @ApiProperty({
    description: 'ID del estudiante',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  studentId: string;

  @ApiProperty({
    description: 'Estado de asistencia',
    enum: AttendanceStatusEnum,
    example: AttendanceStatusEnum.PRESENT,
  })
  @IsEnum(AttendanceStatusEnum)
  status: AttendanceStatusEnum;

  @ApiProperty({
    description: 'Notas adicionales sobre la asistencia',
    example: 'Llegó 15 minutos tarde',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class MarkAttendanceRequestDto {
  @ApiProperty({
    description: 'Tipo de asistencia a registrar',
    enum: AttendanceTypeEnum,
    example: AttendanceTypeEnum.STAND_UP,
  })
  @IsEnum(AttendanceTypeEnum)
  type: AttendanceTypeEnum;

  @ApiProperty({
    description: 'Lista de estudiantes con su estado de asistencia',
    type: [AttendanceRecordRequestDto],
    example: [
      {
        studentId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'PRESENT',
        notes: 'Presente',
      },
      {
        studentId: '550e8400-e29b-41d4-a716-446655440001',
        status: 'ABSENT',
        notes: 'Justificado',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordRequestDto)
  records: AttendanceRecordRequestDto[];
}
