import {
  Controller,
  Get,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthProtected } from '../../auth/decorator/auth-protected.decorator';
import { UserRole } from '../../user/entities/user.entity';
import { AdminDashboardService } from './admin-dashboard.service';
import type { AdminStatsDTO } from './dto/get-stats.dto';
import { GetReportedPostsDocs } from './docs/get-reported-posts.swagger';
import { GetReportedCommentsDocs } from './docs/get-reported-comments.swagger';
import { GetAdminStatsDocs } from './docs/get-stats.swagger';

@ApiTags('Dashboard (Admin)')
@Controller('dashboard/admin')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('stats')
  @AuthProtected(UserRole.ADMIN)
  @GetAdminStatsDocs()
  async getStats(): Promise<AdminStatsDTO> {
    return this.adminDashboardService.getStats();
  }

  @Get('reported-posts')
  @AuthProtected(UserRole.ADMIN)
  @GetReportedPostsDocs()
  async getReportedPosts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.adminDashboardService.getReportedPosts(page, limit);
  }

  @Get('reported-comments')
  @AuthProtected(UserRole.ADMIN)
  @GetReportedCommentsDocs()
  async getReportedComments(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.adminDashboardService.getReportedComments(page, limit);
  }
}
