import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { PaymentsService } from './payments.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../user/entities/user.entity';
import { AuthProtected } from '../auth/decorator/auth-protected.decorator';
import { SubscriptionPlan } from './entities/subscription.entity';

// ============================================
// ENDPOINTS PARA USUARIOS
// ============================================

@ApiTags('subscription')
@Controller('subscription')
@AuthProtected(UserRole.MEMBER)
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly paymentsService: PaymentsService,
  ) {}

  // Ver mi suscripción actual
  @Get('me')
  @ApiOperation({ summary: '1️⃣ Ver mi suscripción actual' })
  async getMySubscription(@CurrentUser('id') userId: string) {
    return this.subscriptionService.getUserSubscription(userId);
  }

  // Ver planes disponibles
  @Get('plans')
  @ApiOperation({ summary: '2️⃣ Ver planes disponibles' })
  getPlans() {
    return this.subscriptionService.getAvailablePlans();
  }

  // Crear pago (cambiar de plan)
  @Post('upgrade')
  @ApiOperation({ summary: '3️⃣ Mejorar plan de suscripción' })
  async upgradePlan(
    @CurrentUser('id') userId: string,
    @Body() body: { plan: SubscriptionPlan },
  ) {
    return this.subscriptionService.createSubscription(userId, body.plan);
  }

  // Cancelar suscripción
  @Post('cancel')
  @ApiOperation({ summary: '4️⃣ Cancelar suscripción' })
  async cancelSubscription(
    @CurrentUser('id') userId: string,
    @Body() body: { reason?: string },
  ) {
    return this.subscriptionService.cancelSubscription(userId, body.reason);
  }

  // Reactivar suscripción
  @Post('reactivate')
  @ApiOperation({ summary: '5️⃣ Reactivar suscripción cancelada' })
  async reactivateSubscription(@CurrentUser('id') userId: string) {
    return this.subscriptionService.reactivateSubscription(userId);
  }

  // Ver historial de pagos
  @Get('payments')
  @ApiOperation({ summary: '6️⃣ Ver mi historial de pagos' })
  async getMyPayments(
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.paymentsService.getUserPayments(userId, page, limit);
  }

  // Descargar recibo de pago
  @Get('payments/:id/receipt')
  @ApiOperation({ summary: '7️⃣ Descargar recibo de pago' })
  async getPaymentReceipt(
    @CurrentUser('id') userId: string,
    @Param('id') paymentId: string,
  ) {
    return this.paymentsService.getPaymentReceipt(userId, paymentId);
  }

  // Verificar si puedo publicar (límite de posts)
  @Get('can-post')
  @ApiOperation({ summary: '8️⃣ Verificar si puedo crear un post' })
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
