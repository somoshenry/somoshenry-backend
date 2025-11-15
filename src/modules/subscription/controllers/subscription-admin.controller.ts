// import { Controller, Get, Query } from '@nestjs/common';
// import { ApiTags } from '@nestjs/swagger';
// import { SubscriptionService } from '../services/subscription.service';
// import { PaymentsService } from '../services/payments.service';
// import { UserRole } from '../../user/entities/user.entity';
// import { AuthProtected } from '../../auth/decorator/auth-protected.decorator';

// // Importar decoradores de Swagger
// import {
//   ApiGetDashboardStats,
//   ApiGetRevenue,
//   ApiGetSubscriptionsByPlan,
//   ApiGetSubscriptionGrowth,
//   ApiGetRecentPayments,
//   ApiGetFailedPayments,
//   ApiGetUpcomingRenewals,
//   ApiGetChurnRate,
//   ApiGetLTV,
//   ApiGetUsersByPlan,
// } from '../docs';

// // ============================================
// // ENDPOINTS PARA ADMIN - DASHBOARD
// // ============================================

// @ApiTags('Gestión de pagos y suscripciones (Admin)')
// @Controller('admin/dashboard')
// @AuthProtected(UserRole.ADMIN)
// export class SubscriptionAdminController {
//   constructor(
//     private readonly subscriptionService: SubscriptionService,
//     private readonly paymentsService: PaymentsService,
//   ) {}

//   // 1. Estadísticas generales
//   @Get('stats')
//   @ApiGetDashboardStats()
//   async getGeneralStats() {
//     return this.paymentsService.getGeneralStats();
//   }

//   // 2. Ingresos por período
//   @Get('revenue')
//   @ApiGetRevenue()
//   async getRevenue(
//     @Query('period') period: 'day' | 'week' | 'month' | 'year' = 'month',
//     @Query('startDate') startDate?: string,
//     @Query('endDate') endDate?: string,
//   ) {
//     return this.paymentsService.getRevenue(period, startDate, endDate);
//   }

//   // 3. Gráfica de suscripciones por plan
//   @Get('subscriptions/by-plan')
//   @ApiGetSubscriptionsByPlan()
//   async getSubscriptionsByPlan() {
//     return this.subscriptionService.getSubscriptionsByPlan();
//   }

//   // 4. Suscripciones nuevas por mes
//   @Get('subscriptions/growth')
//   @ApiGetSubscriptionGrowth()
//   async getSubscriptionGrowth(@Query('months') months: number = 12) {
//     return this.subscriptionService.getSubscriptionGrowth(months);
//   }

//   // 5. Lista de pagos recientes
//   @Get('payments/recent')
//   @ApiGetRecentPayments()
//   async getRecentPayments(
//     @Query('page') page: number = 1,
//     @Query('limit') limit: number = 20,
//   ) {
//     return this.paymentsService.getRecentPayments(page, limit);
//   }

//   // 6. Pagos fallidos
//   @Get('payments/failed')
//   @ApiGetFailedPayments()
//   async getFailedPayments() {
//     return this.paymentsService.getFailedPayments();
//   }

//   // 7. Próximas renovaciones
//   @Get('subscriptions/upcoming-renewals')
//   @ApiGetUpcomingRenewals()
//   async getUpcomingRenewals(@Query('days') days: number = 7) {
//     return this.subscriptionService.getUpcomingRenewals(days);
//   }

//   // 8. Tasa de cancelación (churn rate)
//   @Get('subscriptions/churn-rate')
//   @ApiGetChurnRate()
//   async getChurnRate() {
//     return this.subscriptionService.getChurnRate();
//   }

//   // 9. Lifetime Value (LTV) promedio
//   @Get('subscriptions/ltv')
//   @ApiGetLTV()
//   async getLTV() {
//     return this.subscriptionService.getLTV();
//   }

//   // 10. Usuarios por tipo de plan
//   @Get('users/by-plan')
//   @ApiGetUsersByPlan()
//   async getUsersByPlan() {
//     return this.subscriptionService.getUsersByPlan();
//   }
// }
