import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsInt,
  MaxLength,
} from 'class-validator';
import {
  CohorteModalityEnum,
  CohorteStatusEnum,
} from '../../cohorte/enums/cohorte.enums';

export class CreateCohorteRequestDto {
  @ApiProperty({
    description: 'Nombre de la cohorte a crear',
    example: 'Full Stack Development - Cohort 2024',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Descripción detallada del programa y objetivos',
    example: 'Programa intensivo de 6 meses en desarrollo web full stack',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Fecha de inicio del programa en formato ISO 8601',
    example: '2024-01-15T00:00:00Z',
    type: 'string',
    format: 'date-time',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @ApiProperty({
    description: 'Fecha de finalización del programa en formato ISO 8601',
    example: '2024-06-30T23:59:59Z',
    type: 'string',
    format: 'date-time',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @ApiProperty({
    description: 'Estado inicial de la cohorte',
    enum: CohorteStatusEnum,
    example: CohorteStatusEnum.UPCOMING,
    required: false,
    default: CohorteStatusEnum.UPCOMING,
  })
  @IsOptional()
  @IsEnum(CohorteStatusEnum)
  status?: CohorteStatusEnum;

  @ApiProperty({
    description:
      'Horario del programa con formato libre, ej: "Lunes a Viernes 09:00-18:00"',
    example: 'Lunes a Viernes 09:00 - 18:00',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  schedule?: string;

  @ApiProperty({
    description: 'Modalidad del programa (tiempo completo o parcial)',
    enum: CohorteModalityEnum,
    example: CohorteModalityEnum.FULL_TIME,
    required: false,
    default: CohorteModalityEnum.FULL_TIME,
  })
  @IsOptional()
  @IsEnum(CohorteModalityEnum)
  modality?: CohorteModalityEnum;

  @ApiProperty({
    description: 'Cantidad máxima de estudiantes que puede contener la cohorte',
    example: 30,
    type: 'integer',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  maxStudents?: number;
}
