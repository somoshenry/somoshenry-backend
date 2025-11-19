import { ApiProperty } from '@nestjs/swagger';
import {
  CohorteStatusEnum,
  CohorteModalityEnum,
} from '../../cohorte/enums/cohorte.enums';

export class CohorteResponseDto {
  @ApiProperty({
    description: 'Identificador único de la cohorte',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre de la cohorte',
    example: 'Full Stack Development - Cohort 2024',
    maxLength: 100,
  })
  name: string;

  @ApiProperty({
    description: 'Descripción detallada de la cohorte',
    example:
      'Programa intensivo de desarrollo web full stack con enfoque práctico',
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    description: 'Fecha de inicio del programa',
    example: '2024-01-15',
    type: 'string',
    format: 'date',
    nullable: true,
  })
  startDate?: Date;

  @ApiProperty({
    description: 'Fecha de finalización del programa',
    example: '2024-06-30',
    type: 'string',
    format: 'date',
    nullable: true,
  })
  endDate?: Date;

  @ApiProperty({
    description: 'Estado actual de la cohorte',
    enum: CohorteStatusEnum,
    example: CohorteStatusEnum.ACTIVE,
  })
  status: CohorteStatusEnum;

  @ApiProperty({
    description:
      'Horario del programa (formato libre, ej: "Lunes a Viernes 9:00-17:00")',
    example: 'Lunes a Viernes 09:00 - 18:00',
    nullable: true,
  })
  schedule?: string;

  @ApiProperty({
    description: 'Modalidad del programa',
    enum: CohorteModalityEnum,
    example: CohorteModalityEnum.FULL_TIME,
  })
  modality: CohorteModalityEnum;

  @ApiProperty({
    description: 'Cantidad máxima de estudiantes permitidos',
    example: 30,
    nullable: true,
    type: 'integer',
  })
  maxStudents?: number;

  @ApiProperty({
    description: 'Fecha de creación del registro',
    example: '2024-01-10T10:30:00Z',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del registro',
    example: '2024-01-12T14:45:00Z',
    type: 'string',
    format: 'date-time',
  })
  updatedAt: Date;
}
