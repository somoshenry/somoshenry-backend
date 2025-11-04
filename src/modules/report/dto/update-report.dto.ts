import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ReportStatus } from '../entities/report.entity';

export class UpdateReportDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @IsOptional()
  @IsUUID()
  reviewerId?: string;
}
