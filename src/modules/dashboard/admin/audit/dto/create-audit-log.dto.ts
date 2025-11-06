import { AuditAction } from '../enums/audit-action.enum';

export class CreateAuditLogDto {
  adminId!: string;
  action!: AuditAction;
  targetType!: string;
  targetId!: string;
  details?: string;
}
