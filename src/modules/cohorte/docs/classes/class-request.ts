import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsInt,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { ClassStatusEnum } from '../../cohorte/enums/cohorte.enums';

export class CreateClassRequestDto {
  @ApiProperty({
    description: 'ID de la cohorte',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  cohorteId: string;

  @ApiProperty({
    description: 'Nombre de la clase',
    example: 'Introducción a TypeScript',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Descripción de la clase',
    example: 'En esta clase aprenderemos los conceptos básicos de TypeScript',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Módulo al que pertenece',
    example: 'Fundamentos',
    required: false,
  })
  @IsOptional()
  @IsString()
  module?: string;

  @ApiProperty({
    description: 'Fecha y hora programada',
    example: '2025-02-15T14:00:00Z',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduledDate?: Date;

  @ApiProperty({
    description: 'Duración en minutos',
    example: 90,
    type: 'integer',
    required: false,
  })
  @IsOptional()
  @IsInt()
  duration?: number;

  @ApiProperty({
    description: 'ID del profesor',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiProperty({
    description: 'URL de la reunión',
    example: 'https://meet.google.com/abc-defg-hij',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  meetingUrl?: string;

  @ApiProperty({
    description: 'URL de la grabación',
    example: 'https://drive.google.com/file/d/...',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  recordingUrl?: string;

  @ApiProperty({
    description: 'URL de materiales',
    example: 'https://example.com/materials',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  materialsUrl?: string;

  @ApiProperty({
    description: 'Estado de la clase',
    enum: ClassStatusEnum,
    example: ClassStatusEnum.SCHEDULED,
    required: false,
  })
  @IsOptional()
  @IsEnum(ClassStatusEnum)
  status?: ClassStatusEnum;
}

export class UpdateClassRequestDto {
  @ApiProperty({
    description: 'Nombre de la clase',
    example: 'Introducción a TypeScript',
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiProperty({
    description: 'Descripción de la clase',
    example: 'En esta clase aprenderemos los conceptos básicos de TypeScript',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Módulo al que pertenece',
    example: 'Fundamentos',
    required: false,
  })
  @IsOptional()
  @IsString()
  module?: string;

  @ApiProperty({
    description: 'Fecha y hora programada',
    example: '2025-02-15T14:00:00Z',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduledDate?: Date;

  @ApiProperty({
    description: 'Duración en minutos',
    example: 90,
    type: 'integer',
    required: false,
  })
  @IsOptional()
  @IsInt()
  duration?: number;

  @ApiProperty({
    description: 'URL de la reunión',
    example: 'https://meet.google.com/abc-defg-hij',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  meetingUrl?: string;

  @ApiProperty({
    description: 'URL de la grabación',
    example: 'https://drive.google.com/file/d/...',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  recordingUrl?: string;

  @ApiProperty({
    description: 'URL de materiales',
    example: 'https://example.com/materials',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  materialsUrl?: string;

  @ApiProperty({
    description: 'Estado de la clase',
    enum: ClassStatusEnum,
    example: ClassStatusEnum.SCHEDULED,
    required: false,
  })
  @IsOptional()
  @IsEnum(ClassStatusEnum)
  status?: ClassStatusEnum;
}
