import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { Repository } from 'typeorm';
import { DateUtil } from 'src/common/utils/date.util';
import { PostService } from 'src/modules/post/post.service';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/modules/user/user.service';
import { UserRole } from 'src/modules/user/entities/user.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly configService: ConfigService,
    private readonly postsService: PostService,
    private readonly userService: UserService,
  ) {}

  // ============================================
  // PLANES DISPONIBLES
  // ============================================
  getAvailablePlans() {
    const plans = this.configService.get('mercadopago.plans');
    return Object.keys(plans).map((key) => ({
      id: key,
      ...plans[key],
    }));
  }

  // ============================================
  // OBTENER PLAN ACTUAL DEL USUARIO
  // ============================================
  async getUserPlan(userId: string): Promise<SubscriptionPlan> {
    const sub = await this.subscriptionRepository.findOne({
      where: { userId },
    });
    return sub?.plan ?? SubscriptionPlan.BRONCE;
  }

  // ============================================
  // SUSCRIPCIÓN ACTUAL DEL USUARIO
  // ============================================
  async getCurrentSubscription(userId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('El usuario no tiene suscripción');
    }

    return subscription;
  }

  // ============================================
  // VERIFICAR LÍMITE DE POSTS
  // ============================================
  async canUserPost(userId: string): Promise<boolean> {
    // Obtener usuario y verificar rol (admin/teacher sin límites)
    const user = await this.userService.findOne(userId);
    if (!user) return false;
    if (user.role === UserRole.ADMIN || user.role === UserRole.TEACHER)
      return true;

    const subscription = await this.subscriptionRepository.findOne({
      where: { userId },
    });

    // EVALUAR LÍMITES POR TIEMPO DE SUSCRIPCIÓN (fecha de vencimiento)

    // Sin suscripción activa = NO puede publicar
    if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE)
      return false;

    // Plan gratis (sin endDate) -> puede publicar siempre
    if (!subscription.endDate) return true;

    // Si la suscripción expiró -> no puede publicar
    if (DateUtil.isPast(subscription.endDate)) return false;

    // EVALUAR LÍMITES SEGÚN PLAN (cantidad de publicaciones)

    const plan = subscription.plan ?? SubscriptionPlan.BRONCE; // Valor por defecto si es null o undefined

    if (plan === SubscriptionPlan.ORO) {
      // ORO tiene posts ilimitados
      return true;
    }

    const planConfig = this.configService.get(`mercadopago.plans.${plan}`);
    const maxPosts = planConfig.maxPostsPerMonth;

    if (maxPosts === -1) {
      return true; // Ilimitado
    }

    const postCount = await this.countUserPostsThisMonth(userId);

    return postCount < maxPosts; // Permitir si no ha alcanzado el límite
  }

  // Contar posts del mes actual
  private async countUserPostsThisMonth(userId: string): Promise<number> {
    const startOfMonth = DateUtil.getStartOfMonth();
    const endOfMonth = DateUtil.getEndOfMonth();

    return await this.postsService.countPostsInPeriod(
      userId,
      startOfMonth,
      endOfMonth,
    );
  }

  // ============================================
  // POSTS RESTANTES DEL MES
  // ============================================
  async getRemainingPosts(userId: string): Promise<number> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId },
    });

    if (!subscription) return 0;

    const planConfig = this.configService.get(
      `mercadopago.plans.${subscription.plan}`,
    );
    const maxPosts = planConfig.maxPostsPerMonth;

    if (maxPosts === -1) return -1; // Ilimitado

    const used = await this.countUserPostsThisMonth(userId);
    return Math.max(0, maxPosts - used);
  }

  // ============================================
  // CANCELAR SUSCRIPCIÓN
  // ============================================
  async cancelSubscription(userId: string, reason?: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    subscription.autoRenew = false;
    subscription.cancelledAt = DateUtil.nowUTC();
    subscription.cancellationReason = reason || 'Sin especificar';

    await this.subscriptionRepository.save(subscription);

    return {
      message:
        'Suscripción cancelada. Seguirás teniendo acceso hasta el fin del período.',
      endsAt: subscription.endDate,
    };
  }

  // ============================================
  // REACTIVAR SUSCRIPCIÓN
  // ============================================
  async reactivateSubscription(userId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    subscription.autoRenew = true;
    subscription.cancelledAt = null;
    subscription.cancellationReason = null;

    await this.subscriptionRepository.save(subscription);

    return {
      message: 'Suscripción reactivada',
      nextBillingDate: subscription.nextBillingDate,
    };
  }
}
