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
  @ValidateIf((o: CreateReportDto) => !o.commentId && !o.reportedUserId)
  @IsUUID()
  postId?: string;

  @ValidateIf((o: CreateReportDto) => !o.postId && !o.reportedUserId)
  @IsUUID()
  commentId?: string;

  @ValidateIf((o: CreateReportDto) => !o.postId && !o.commentId)
  @IsUUID()
  reportedUserId?: string;

  @IsEnum(ReportReason)
  reason: ReportReason;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;
}
