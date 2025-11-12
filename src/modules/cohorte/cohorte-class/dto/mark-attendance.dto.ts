import {
  IsArray,
  ValidateNested,
  IsEnum,
  IsUUID,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatusEnum } from '../../cohorte/enums/cohorte.enums';
import { AttendanceTypeEnum } from '../../cohorte/enums/cohorte.enums';

class AttendanceRecordDto {
  @IsUUID()
  studentId: string;

  @IsEnum(AttendanceStatusEnum)
  status: AttendanceStatusEnum;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class MarkAttendanceDto {
  @IsEnum(AttendanceTypeEnum)
  type: AttendanceTypeEnum;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];
}
