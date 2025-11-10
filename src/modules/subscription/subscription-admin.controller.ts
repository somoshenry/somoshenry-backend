import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { PaymentsService } from './payments.service';
import { UserRole } from '../user/entities/user.entity';
import { AuthProtected } from '../auth/decorator/auth-protected.decorator';

// ============================================
// ENDPOINTS PARA ADMIN - DASHBOARD
// ============================================

@ApiTags('admin/dashboard')
@Controller('admin/dashboard')
@AuthProtected(UserRole.ADMIN)
export class SubscriptionAdminController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly paymentsService: PaymentsService,
  ) {}

  // 1. Estadísticas generales
  @Get('stats')
  @ApiOperation({ summary: '📊 Estadísticas generales del negocio' })
  async getGeneralStats() {
    return this.paymentsService.getGeneralStats();
  }

  // 2. Ingresos por período
  @Get('revenue')
  @ApiOperation({ summary: '💰 Ingresos por período' })
  async getRevenue(
    @Query('period') period: 'day' | 'week' | 'month' | 'year' = 'month',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.paymentsService.getRevenue(period, startDate, endDate);
  }

  // 3. Gráfica de suscripciones por plan
  @Get('subscriptions/by-plan')
  @ApiOperation({ summary: '📈 Distribución de suscripciones por plan' })
  async getSubscriptionsByPlan() {
    return this.subscriptionService.getSubscriptionsByPlan();
  }

  // 4. Suscripciones nuevas por mes
  @Get('subscriptions/growth')
  @ApiOperation({ summary: '📅 Crecimiento de suscripciones' })
  async getSubscriptionGrowth(@Query('months') months: number = 12) {
    return this.subscriptionService.getSubscriptionGrowth(months);
  }

  // 5. Lista de pagos recientes
  @Get('payments/recent')
  @ApiOperation({ summary: '💳 Pagos recientes' })
  async getRecentPayments(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.paymentsService.getRecentPayments(page, limit);
  }

  // 6. Pagos fallidos
  @Get('payments/failed')
  @ApiOperation({ summary: '❌ Pagos fallidos' })
  async getFailedPayments() {
    return this.paymentsService.getFailedPayments();
  }

  // 7. Próximas renovaciones
  @Get('subscriptions/upcoming-renewals')
  @ApiOperation({ summary: '🔄 Próximas renovaciones' })
  async getUpcomingRenewals(@Query('days') days: number = 7) {
    return this.subscriptionService.getUpcomingRenewals(days);
  }

  // 8. Tasa de cancelación (churn rate)
  @Get('subscriptions/churn-rate')
  @ApiOperation({ summary: '📉 Tasa de cancelación mensual' })
  async getChurnRate() {
    return this.subscriptionService.getChurnRate();
  }

  // 9. Lifetime Value (LTV) promedio
  @Get('subscriptions/ltv')
  @ApiOperation({ summary: '💎 Lifetime Value promedio de clientes' })
  async getLTV() {
    return this.subscriptionService.getLTV();
  }

  // 10. Usuarios por tipo de plan
  @Get('users/by-plan')
  @ApiOperation({ summary: '👥 Usuarios distribuidos por plan' })
  async getUsersByPlan() {
    return this.subscriptionService.getUsersByPlan();
  }
}
