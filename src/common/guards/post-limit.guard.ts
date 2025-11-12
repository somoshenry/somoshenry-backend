import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { SubscriptionService } from '../../modules/subscription/services/subscription.service';

@Injectable()
export class PostLimitGuard implements CanActivate {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Verificar si puede publicar
    const canPost = await this.subscriptionService.canUserPost(userId);

    if (!canPost) {
      const plan = await this.subscriptionService.getUserPlan(userId);

      throw new ForbiddenException({
        message: 'Has alcanzado el límite de publicaciones de tu plan',
        plan,
        remaining: 0,
        upgradeUrl: '/subscription/upgrade',
      });
    }

    return true;
  }
}
