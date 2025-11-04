import {
  IsUUID,
  IsOptional,
  IsEnum,
  IsString,
  Length,
  ValidateIf,
} from 'class-validator';
import { ReportReason } from '../entities/report.entity';

export class CreateReportDto {
  // Tipamos explícitamente 'o' para evitar el error de ESLint
  @ValidateIf((o: CreateReportDto) => !o.commentId)
  @IsUUID()
  postId?: string;

  @ValidateIf((o: CreateReportDto) => !o.postId)
  @IsUUID()
  commentId?: string;

  @IsEnum(ReportReason)
  reason: ReportReason;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;
}
