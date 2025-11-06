import {
  Controller,
  Post as HttpPost,
  Get,
  Patch,
  Param,
  Body,
  Req,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { AuthProtected } from '../auth/decorator/auth-protected.decorator';
import { Request } from 'express';
import { ReportStatus } from './entities/report.entity';
import { UserRole } from '../user/entities/user.entity';

import {
  CreateReportDocs,
  GetPendingReportsDocs,
  GetAllReportsDocs,
  UpdateReportStatusDocs,
} from './docs/report.swagger';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
export class ReportController {
  constructor(private readonly service: ReportService) {}

  @HttpPost()
  @AuthProtected()
  @CreateReportDocs
  async create(
    @Body() dto: CreateReportDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    const reporterId = req.user.id;
    const created = await this.service.create(dto, reporterId);
    return { message: 'Reporte creado correctamente', report: created };
  }

  @Get('pending')
  @AuthProtected(UserRole.ADMIN)
  @GetPendingReportsDocs
  async findPending() {
    const data = await this.service.findPending();
    return { data };
  }

  @Get()
  @AuthProtected(UserRole.ADMIN)
  @GetAllReportsDocs
  async findAll(@Query('status') status?: ReportStatus) {
    const data = await this.service.findAll(status);
    return { data };
  }

  @Patch(':id/status')
  @AuthProtected(UserRole.ADMIN)
  @UpdateReportStatusDocs
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReportDto,
    @Req() req: Request & { user: { id: string; role: UserRole } },
  ) {
    const updated = await this.service.updateStatus(
      id,
      dto,
      req.user.id,
      req.user.role,
    );
    return { message: 'Reporte actualizado', report: updated };
  }
}
