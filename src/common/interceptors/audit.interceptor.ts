import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DataSource, Repository } from 'typeorm';
import { AuditLog } from '../../modules/dashboard/admin/audit/entities/audit-log.entity';
import { AuditAction } from '../../modules/dashboard/admin/audit/enums/audit-action.enum';
import { UserRole, User } from '../../modules/user/entities/user.entity';

interface RequestWithUser {
  user?: User;
  method: string;
  route?: { path?: string };
  url: string;
  body?: unknown;
  params?: Record<string, string>;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly auditRepo: Repository<AuditLog>;

  constructor(private readonly dataSource: DataSource) {
    this.auditRepo = this.dataSource.getRepository(AuditLog);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const user = req.user;

    const isAdmin = user?.role === UserRole.ADMIN;
    const isMutable = ['POST', 'PATCH', 'DELETE'].includes(req.method);

    if (!isAdmin || !isMutable) {
      return next.handle();
    }

    const path = req.route?.path ?? req.url;
    const targetType = path.split('/')[1]?.toUpperCase() ?? 'UNKNOWN';
    const targetId = req.params?.id ?? 'N/A';
    const details = JSON.stringify({
      body: req.body ?? null,
      params: req.params ?? null,
    });

    return next.handle().pipe(
      tap(() => {
        const action =
          req.method === 'DELETE'
            ? AuditAction.DELETE
            : req.method === 'PATCH'
              ? AuditAction.UPDATE
              : AuditAction.CREATE;

        const log = this.auditRepo.create({
          adminId: user.id,
          action,
          targetType,
          targetId,
          details,
        });

        // Ejecutar sin devolver la promesa (cumple ESLint)
        void this.auditRepo.save(log).catch((err) => {
          // Evitamos romper el flujo si falla el guardado
          console.error('[AuditInterceptor] Error saving log:', err);
        });
      }),
    );
  }
}
