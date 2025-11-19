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

export class CreateCohorteClassDto {
  @IsUUID()
  cohorteId: string;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: Date;

  @IsOptional()
  @IsInt()
  duration?: number;

  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @IsOptional()
  @IsUrl()
  meetingUrl?: string;

  @IsOptional()
  @IsUrl()
  recordingUrl?: string;

  @IsOptional()
  @IsUrl()
  materialsUrl?: string;

  @IsOptional()
  @IsEnum(ClassStatusEnum)
  status?: ClassStatusEnum;
}
