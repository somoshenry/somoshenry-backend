import { Module } from '@nestjs/common';
import { AdminDashboardModule } from './admin/admin-dashboard.module';

@Module({
  imports: [AdminDashboardModule],
})
export class DashboardModule {}
