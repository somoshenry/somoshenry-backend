import {
  Controller,
  Get,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { AuthProtected } from '../../../auth/decorator/auth-protected.decorator';
import { UserRole } from '../../../user/entities/user.entity';
import { AdminAuditService } from './admin-audit.service';
import type { Response } from 'express';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { AuditAction } from './enums/audit-action.enum';

@ApiTags('Admin Audit')
@Controller('dashboard/admin/audit')
export class AdminAuditController {
  constructor(private readonly audit: AdminAuditService) {}

  @Get()
  @AuthProtected(UserRole.ADMIN)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'adminId', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'targetType', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  async list(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('adminId') adminId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<ReturnType<AdminAuditService['list']>> {
    return this.audit.list({
      page,
      limit,
      adminId,
      action: action as AuditAction | undefined,
      targetType,
      from,
      to,
    });
  }

  @Get('export')
  @AuthProtected(UserRole.ADMIN)
  @ApiQuery({ name: 'adminId', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'targetType', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  async export(
    @Res() res: Response,
    @Query('adminId') adminId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<void> {
    const csv = await this.audit.exportCsv({
      adminId,
      action: action as AuditAction | undefined,
      targetType,
      from,
      to,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="audit-logs.csv"',
    );
    res.status(200).send(csv);
  }
}
