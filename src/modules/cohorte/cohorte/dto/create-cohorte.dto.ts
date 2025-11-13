import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsInt,
  MaxLength,
} from 'class-validator';
import { CohorteModalityEnum, CohorteStatusEnum } from '../enums/cohorte.enums';

export class CreateCohorteDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @IsEnum(CohorteStatusEnum)
  status?: CohorteStatusEnum;

  @IsOptional()
  @IsString()
  schedule?: string;

  @IsOptional()
  @IsEnum(CohorteModalityEnum)
  modality?: CohorteModalityEnum;

  @IsOptional()
  @IsInt()
  maxStudents?: number;
}
