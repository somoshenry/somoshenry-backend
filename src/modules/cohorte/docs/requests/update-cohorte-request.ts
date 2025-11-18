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

export class UpdateCohorteRequestDto {
  @ApiProperty({
    description: 'Nuevo nombre de la cohorte',
    example: 'Full Stack Development - Cohort 2024',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: 'Descripción actualizada del programa',
    example: 'Programa intensivo de 6 meses en desarrollo web full stack',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Nueva fecha de inicio en formato ISO 8601',
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
    description: 'Nueva fecha de finalización en formato ISO 8601',
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
    description: 'Nuevo estado de la cohorte',
    enum: CohorteStatusEnum,
    example: CohorteStatusEnum.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(CohorteStatusEnum)
  status?: CohorteStatusEnum;

  @ApiProperty({
    description: 'Nuevo horario del programa',
    example: 'Lunes a Viernes 09:00 - 18:00',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  schedule?: string;

  @ApiProperty({
    description: 'Nueva modalidad del programa',
    enum: CohorteModalityEnum,
    example: CohorteModalityEnum.FULL_TIME,
    required: false,
  })
  @IsOptional()
  @IsEnum(CohorteModalityEnum)
  modality?: CohorteModalityEnum;

  @ApiProperty({
    description: 'Nueva cantidad máxima de estudiantes',
    example: 35,
    type: 'integer',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  maxStudents?: number;
}
