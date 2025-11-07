import { AuditAction } from '../enums/audit-action.enum';

export interface ListFiltersBase {
  page?: number;
  limit?: number;
  adminId?: string;
  action?: AuditAction;
  targetType?: string;
  from?: string;
  to?: string;
}

export type ListAuditFilters = ListFiltersBase;
