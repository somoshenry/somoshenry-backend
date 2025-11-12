import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SubscriptionService } from '../services/subscription.service';
import { PaymentsService } from '../services/payments.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../user/entities/user.entity';
import { AuthProtected } from '../../auth/decorator/auth-protected.decorator';
import { SubscriptionPlan } from '../entities/subscription.entity';

// Importar decoradores de Swagger
import {
  ApiGetMySubscription,
  ApiGetPlans,
  ApiUpgradePlan,
  ApiCancelSubscription,
  ApiReactivateSubscription,
  ApiGetMyPayments,
  ApiGetPaymentReceipt,
  ApiCanPost,
} from '../docs';

// ============================================
// ENDPOINTS PARA USUARIOS
// ============================================

@ApiTags('Gestión de pagos y suscripciones (Member)')
@Controller('subscription')
@AuthProtected(UserRole.MEMBER)
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly paymentsService: PaymentsService,
  ) {}

  // Ver mi suscripción actual
  @Get('me')
  @ApiGetMySubscription()
  async getMySubscription(@CurrentUser('id') userId: string) {
    return this.subscriptionService.getUserSubscription(userId);
  }

  // Ver planes disponibles
  @Get('plans')
  @ApiGetPlans()
  getPlans() {
    return this.subscriptionService.getAvailablePlans();
  }

  // Crear pago (cambiar de plan)
  @Post('upgrade')
  @ApiUpgradePlan()
  async upgradePlan(
    @CurrentUser('id') userId: string,
    @Body() body: { plan: SubscriptionPlan },
  ) {
    return this.subscriptionService.createSubscription(userId, body.plan);
  }

  // Cancelar suscripción
  @Post('cancel')
  @ApiCancelSubscription()
  async cancelSubscription(
    @CurrentUser('id') userId: string,
    @Body() body: { reason?: string },
  ) {
    return this.subscriptionService.cancelSubscription(userId, body.reason);
  }

  // Reactivar suscripción
  @Post('reactivate')
  @ApiReactivateSubscription()
  async reactivateSubscription(@CurrentUser('id') userId: string) {
    return this.subscriptionService.reactivateSubscription(userId);
  }

  // Ver historial de pagos
  @Get('payments')
  @ApiGetMyPayments()
  async getMyPayments(
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.paymentsService.getUserPayments(userId, page, limit);
  }

  // Descargar recibo de pago
  @Get('payments/:id/receipt')
  @ApiGetPaymentReceipt()
  async getPaymentReceipt(
    @CurrentUser('id') userId: string,
    @Param('id') paymentId: string,
  ) {
    return this.paymentsService.getPaymentReceipt(userId, paymentId);
  }

  // Verificar si puedo publicar (límite de posts)
  @Get('can-post')
  @ApiCanPost()
  async canPost(@CurrentUser('id') userId: string) {
    const canPost = await this.subscriptionService.canUserPost(userId);
    const remaining = await this.subscriptionService.getRemainingPosts(userId);

    return {
      canPost,
      remaining,
      plan: await this.subscriptionService.getUserPlan(userId),
    };
  }
}
