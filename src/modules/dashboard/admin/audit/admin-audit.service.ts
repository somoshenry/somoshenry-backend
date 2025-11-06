import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { Parser as Json2CsvParser } from 'json2csv';

import { AuditLog } from './entities/audit-log.entity';
import { AuditAction } from './enums/audit-action.enum';
import type { CreateAuditLogDto } from './dto/create-audit-log.dto';
import type { ListAuditFilters } from './types/audit-filters.interface';

type ListedAuditRow = {
  id: string;
  adminId: string;
  adminUsername: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  details: string | null;
  createdAt: string;
};

@Injectable()
export class AdminAuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  private parseDateOrUndefined(v?: string): Date | undefined {
    if (!v) return undefined;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }

  private toISO(d: Date | string | undefined | null): string {
    if (!d) return 'Sin actividad';
    const date = typeof d === 'string' ? new Date(d) : d;
    return Number.isNaN(date.getTime()) ? 'Sin actividad' : date.toISOString();
  }

  async log(dto: CreateAuditLogDto): Promise<AuditLog> {
    const doc = this.auditRepo.create(dto);
    return this.auditRepo.save(doc);
  }

  async list(filters: ListAuditFilters) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));

    const where: FindOptionsWhere<AuditLog> = {};
    if (filters.adminId) where.adminId = filters.adminId;
    if (filters.action) where.action = filters.action;

    const from = this.parseDateOrUndefined(filters.from);
    const to = this.parseDateOrUndefined(filters.to);
    if (from && to) where.createdAt = Between(from, to);
    else if (from) where.createdAt = Between(from, new Date('9999-12-31'));
    else if (to) where.createdAt = Between(new Date('0001-01-01'), to);

    const qb = this.auditRepo
      .createQueryBuilder('a')
      .leftJoin('a.admin', 'admin')
      .select([
        'a.id AS id',
        'a.adminId AS adminId',
        'COALESCE(admin.username, \'N/A\') AS "adminUsername"',
        'a.action AS action',
        'a.targetType AS "targetType"',
        'a.targetId AS "targetId"',
        'a.details AS details',
        'a.createdAt AS "createdAt"',
      ])
      .orderBy('a.createdAt', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit);

    qb.where('1=1');
    if (where.adminId)
      qb.andWhere('a.adminId = :adminId', { adminId: where.adminId });
    if (where.action)
      qb.andWhere('a.action = :action', { action: where.action });
    if (filters.targetType)
      qb.andWhere('a.targetType = :targetType', {
        targetType: filters.targetType,
      });

    // 👇 cast correcto del Between para evitar el error 2352
    const dateRange = where.createdAt as
      | ReturnType<typeof Between<Date>>
      | undefined;

    if (dateRange?.value) {
      const value = dateRange.value as unknown as [Date, Date];
      const [low, high] = value;
      qb.andWhere('a.createdAt BETWEEN :from AND :to', {
        from: low,
        to: high,
      });
    }

    const rows = await qb.getRawMany<{
      id: string;
      adminId: string;
      adminUsername: string | null;
      action: AuditAction;
      targetType: string;
      targetId: string;
      details: string | null;
      createdAt: Date;
    }>();

    const total = await this.auditRepo.count({
      where: {
        ...(where.adminId ? { adminId: where.adminId } : {}),
        ...(where.action ? { action: where.action } : {}),
        ...(filters.targetType ? { targetType: filters.targetType } : {}),
        ...(from || to
          ? {
              createdAt:
                where.createdAt as FindOptionsWhere<AuditLog>['createdAt'],
            }
          : {}),
      },
    });

    const data: ListedAuditRow[] = rows.map((r) => ({
      id: r.id,
      adminId: r.adminId,
      adminUsername: r.adminUsername ?? 'N/A',
      action: r.action,
      targetType: r.targetType,
      targetId: r.targetId,
      details: r.details,
      createdAt: this.toISO(r.createdAt),
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async exportCsv(filters: ListAuditFilters): Promise<string> {
    try {
      const listAll = await this.list({ ...filters, page: 1, limit: 1000 });
      const rows = listAll.data;

      const parser = new Json2CsvParser<ListedAuditRow>({
        fields: [
          { label: 'ID', value: 'id' },
          { label: 'Admin ID', value: 'adminId' },
          { label: 'Admin', value: 'adminUsername' },
          { label: 'Acción', value: 'action' },
          { label: 'Tipo de objetivo', value: 'targetType' },
          { label: 'ID del objetivo', value: 'targetId' },
          {
            label: 'Detalles',
            value: (r: ListedAuditRow) =>
              r.details
                ? r.details.replace(/\s+/g, ' ').replace(/"/g, '""')
                : '',
          },
          { label: 'Fecha de creación', value: 'createdAt' },
        ],
        delimiter: ';',
        quote: '"',
        eol: '\r\n',
      });

      const csv = '\uFEFF' + parser.parse(rows);
      return csv;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(`Error al exportar CSV: ${err.message}`);
      }
      throw new Error('Error desconocido al exportar CSV');
    }
  }
}
