import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AuthProtected } from 'src/modules/auth/decorator/auth-protected.decorator';
import { UserRole } from 'src/modules/user/entities/user.entity';
import { SubscriptionService } from '../services/subscription.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('subscription')
@AuthProtected(UserRole.MEMBER)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // Ver planes disponibles
  @Get('plans')
  getPlans() {
    return this.subscriptionService.getAvailablePlans();
  }

  // Plan actual del usuario
  @Get('userplan')
  async userPlan(@Req() req) {
    const userId = req.user.id;
    return this.subscriptionService.getUserPlan(userId);
  }

  // Ver mi suscripción actual
  @Get('current')
  async getCurrent(@Req() req) {
    const userId = req.user.id;
    return this.subscriptionService.getCurrentSubscription(userId);
  }

  // Verificar si puedo publicar (límite de posts)
  @Get('can-post')
  async canPost(@CurrentUser('id') userId: string) {
    const canPost = await this.subscriptionService.canUserPost(userId);
    const remaining = await this.subscriptionService.getRemainingPosts(userId);
    return {
      canPost,
      remaining,
      plan: await this.subscriptionService.getUserPlan(userId),
    };
  }

  // Cancelar suscripción
  @Post('cancel')
  async cancelSubscription(
    @CurrentUser('id') userId: string,
    @Body() body: { reason?: string },
  ) {
    return this.subscriptionService.cancelSubscription(userId, body.reason);
  }

  // Reactivar suscripción
  @Post('reactivate')
  async reactivateSubscription(@CurrentUser('id') userId: string) {
    return this.subscriptionService.reactivateSubscription(userId);
  }
}
