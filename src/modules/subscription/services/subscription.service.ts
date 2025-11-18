import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { Between, LessThan, Repository } from 'typeorm';
import { DateUtil } from 'src/common/utils/date.util';
import { PostService } from 'src/modules/post/post.service';
import { UserService } from 'src/modules/user/user.service';
import { UserRole } from 'src/modules/user/entities/user.entity';
import { Payment } from '../entities/payment.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly postsService: PostService,
    private readonly userService: UserService,
  ) {}

  // PLANES INTERNOS

  private readonly PLANS = {
    BRONCE: {
      name: 'Plan Gratis',
      price: 0,
      maxPostsPerMonth: 10,
      features: [
        'Máximo 10 posteos mensuales',
        'Sin prioridad en el muro',
        'Acceso a la comunidad',
        'Perfil básico',
        'Mensajería básica',
      ],
    },
    PLATA: {
      name: 'Nivel 1',
      price: 5,
      currency: 'USD',
      maxPostsPerMonth: 50,
      features: [
        'Hasta 50 publicaciones al mes',
        'Prioridad media en el muro',
        'Acceso a eventos exclusivos',
        'Perfil destacado',
        'Soporte prioritario',
        'Sin anuncios',
      ],
    },
    ORO: {
      name: 'Nivel 2',
      price: 10,
      currency: 'USD',
      maxPostsPerMonth: -1, // Ilimitado
      features: [
        'Publicaciones ilimitadas',
        'Máxima prioridad en el muro',
        'Acceso VIP a todos los eventos',
        'Perfil premium destacado',
        'Soporte 24/7 prioritario',
        'Insignia exclusiva',
        'Acceso anticipado a nuevas funciones',
        'Análisis de engagement',
      ],
    },
  };

  // Obtener config de un plan
  private getPlanConfig(plan: SubscriptionPlan) {
    return this.PLANS[plan];
  }

  // PLANES DISPONIBLES

  getAvailablePlans() {
    return Object.entries(this.PLANS).map(([key, value]) => ({
      id: key,
      ...value,
    }));
  }

  // OBTENER PLAN ACTUAL DEL USUARIO

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

    // Admin / Teacher pueden publicar siempre
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

    const config = this.getPlanConfig(subscription.plan);
    const maxPosts = config.maxPostsPerMonth;

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

    const config = this.getPlanConfig(subscription.plan);

    if (config.maxPostsPerMonth === -1) return -1; // Ilimitado

    const used = await this.countUserPostsThisMonth(userId);
    return Math.max(0, config.maxPostsPerMonth - used);
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

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.autoRenew = false;
    subscription.cancelledAt = DateUtil.nowUTC();
    subscription.cancellationReason = reason || 'Sin especificar';

    await this.subscriptionRepository.save(subscription);

    return {
      message:
        'Suscripción cancelada. Seguirás teniendo acceso hasta el fin del período.',
      endsAt: subscription.endDate,
      status: subscription.status,
      cancelledAt: subscription.cancelledAt,
      cancellationReason: subscription.cancellationReason,
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

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.autoRenew = true;
    subscription.cancelledAt = null;
    subscription.cancellationReason = null;

    await this.subscriptionRepository.save(subscription);

    return {
      message: 'Suscripción reactivada',
      status: subscription.status,
      nextBillingDate: subscription.nextBillingDate,
    };
  }

  // ============================================
  // ADMIN
  // ============================================

  // ============================================
  // DISTRIBUCIÓN POR PLAN
  // ============================================
  async getSubscriptionsByPlan() {
    const result = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .select('sub.plan', 'plan')
      .addSelect('COUNT(*)', 'count')
      .where('sub.status = :status', { status: SubscriptionStatus.ACTIVE })
      .groupBy('sub.plan')
      .getRawMany();

    return result.map((r) => ({
      plan: r.plan,
      count: parseInt(r.count),
    }));
  }

  // ============================================
  // CRECIMIENTO DE SUSCRIPCIONES
  // ============================================
  async getSubscriptionGrowth(months: number) {
    const startDate = DateUtil.addMonth(DateUtil.nowUTC(), -months);

    const result = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .select("DATE_TRUNC('month', sub.createdAt)", 'month')
      .addSelect('sub.plan', 'plan')
      .addSelect('COUNT(*)', 'count')
      .where('sub.createdAt >= :startDate', { startDate })
      .groupBy('month, sub.plan')
      .orderBy('month', 'ASC')
      .getRawMany();

    return result.map((r) => ({
      month: r.month,
      plan: r.plan,
      count: parseInt(r.count),
    }));
  }

  // ============================================
  // PRÓXIMAS RENOVACIONES
  // ============================================
  async getUpcomingRenewals(days: number) {
    const now = DateUtil.nowUTC();
    const future = DateUtil.addDays(now, days);

    return await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        autoRenew: true,
        nextBillingDate: Between(now, future),
      },
      relations: ['user'],
      order: { nextBillingDate: 'ASC' },
    });
  }

  // ============================================
  // TASA DE CANCELACIÓN (CHURN RATE)
  // ============================================
  async getChurnRate() {
    const monthStart = DateUtil.getStartOfMonth();
    const now = DateUtil.nowUTC();

    // Total al inicio del mes
    const startTotal = await this.subscriptionRepository.count({
      where: {
        createdAt: LessThan(monthStart),
        status: SubscriptionStatus.ACTIVE,
      },
    });

    // Cancelaciones del mes
    const cancelled = await this.subscriptionRepository.count({
      where: {
        cancelledAt: Between(monthStart, now),
      },
    });

    const churnRate = startTotal > 0 ? (cancelled / startTotal) * 100 : 0;

    return {
      total: startTotal,
      cancelled,
      churnRate: parseFloat(churnRate.toFixed(2)),
    };
  }

  // ============================================
  // LIFETIME VALUE (LTV) PROMEDIO Y POR USUARIO
  // ============================================
  async getLTV(): Promise<{
    averageLTV: number;
    perUser: { userId: string; ltv: number }[];
  }> {
    const rows = await this.paymentRepository
      .createQueryBuilder('p')
      .select('p.userId', 'userId')
      .addSelect('SUM(p.amount)', 'total')
      .groupBy('p.userId')
      .getRawMany();

    const perUser = rows.map((r) => ({
      userId: r.userId,
      ltv: parseFloat(r.total) || 0,
    }));

    const averageLTV =
      perUser.length > 0
        ? perUser.reduce((s, u) => s + u.ltv, 0) / perUser.length
        : 0;

    return { averageLTV: parseFloat(averageLTV.toFixed(2)), perUser };
  }

  // ============================================
  // USUARIOS POR PLAN (CONTEO POR PLAN)
  // ============================================
  async getUsersByPlan() {
    const result = await this.subscriptionRepository
      .createQueryBuilder('s')
      .select('s.plan', 'plan')
      .addSelect('COUNT(DISTINCT s.userId)', 'count')
      .groupBy('s.plan')
      .getRawMany();

    return result.map((r) => ({
      plan: r.plan,
      count: parseInt(r.count, 10),
    }));
  }
}
