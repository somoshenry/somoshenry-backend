import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { DateUtil } from 'src/common/utils/date.util';
import { UserService } from '../user/user.service';
import { PostService } from '../post/post.service';
import { Payment, PaymentStatus } from './entities/payment.entity';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from './entities/subscription.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly configService: ConfigService,
    private readonly postsService: PostService,
    private readonly userService: UserService,
  ) {}

  // ============================================
  // CREAR SUBSCRIPCIÓN (desde el frontend)
  // ============================================
  async createSubscription(userId: string, plan: SubscriptionPlan) {
    const planConfig = this.configService.get(`mercadopago.plans.${plan}`);

    if (!planConfig) {
      throw new BadRequestException('Plan inválido');
    }

    if (plan === SubscriptionPlan.BRONCE) {
      // Plan gratis - crear subscription directamente
      return this.createFreeSubscription(userId);
    }

    // Obtener o crear subscription
    let subscription = await this.subscriptionRepository.findOne({
      where: { userId },
    });

    const now = DateUtil.nowUTC();

    if (!subscription) {
      subscription = this.subscriptionRepository.create({
        userId,
        plan: SubscriptionPlan.BRONCE, // Empieza en BRONCE
        status: SubscriptionStatus.ACTIVE,
        startDate: now,
      });
      await this.subscriptionRepository.save(subscription);
    }

    // Crear preferencia de pago en Mercado Pago
    const preference = await this.createMercadoPagoPreference(
      userId,
      subscription.id,
      plan,
      planConfig,
    );

    return {
      subscriptionId: subscription.id,
      preferenceId: preference.id,
      initPoint: preference.init_point, // URL para redirigir al usuario
      sandboxInitPoint: preference.sandbox_init_point,
    };
  }

  // ============================================
  // CREAR PREFERENCIA EN MERCADO PAGO
  // ============================================
  private async createMercadoPagoPreference(
    userId: string,
    subscriptionId: string,
    plan: SubscriptionPlan,
    planConfig: any,
  ) {
    const accessToken = this.configService.get('mercadopago.accessToken');
    const backUrl = this.configService.get('mercadopago.successUrl');
    const webhookUrl = this.configService.get('mercadopago.webhookUrl');

    // Obtener el email del usuario
    const user = await this.userService.findOne(userId);
    const userEmail = user?.email || 'sin-email@example.com';

    const preference = {
      items: [
        {
          title: planConfig.name,
          description: `Suscripción ${planConfig.name} - somosHenry`,
          quantity: 1,
          unit_price: planConfig.price,
          currency_id: planConfig.currency,
        },
      ],
      payer: {
        email: userEmail, // Usar el email real del usuario
      },
      back_urls: {
        success: `${backUrl}?subscription_id=${subscriptionId}`,
        failure: this.configService.get('mercadopago.failureUrl'),
        pending: this.configService.get('mercadopago.pendingUrl'),
      },
      auto_return: 'approved',
      notification_url: webhookUrl,
      external_reference: subscriptionId, // Importante para identificar
      metadata: {
        user_id: userId,
        subscription_id: subscriptionId,
        plan,
      },
    };

    const response = await axios.post(
      'https://api.mercadopago.com/checkout/preferences',
      preference,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return response.data;
  }

  // ============================================
  // PROCESAR NOTIFICACIÓN DE PAGO (WEBHOOK)
  // ============================================
  async processPaymentNotification(mercadoPagoPaymentId: string) {
    console.log('🔍 Procesando pago:', mercadoPagoPaymentId);

    // Obtener información del pago desde Mercado Pago
    const paymentInfo = await this.getMercadoPagoPayment(mercadoPagoPaymentId);

    console.log('📄 Info del pago:', JSON.stringify(paymentInfo, null, 2));

    const subscriptionId = paymentInfo.external_reference;
    const status = paymentInfo.status; // 'approved', 'pending', 'rejected', etc.

    // Buscar subscription
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      console.error('❌ Subscription no encontrada:', subscriptionId);
      return;
    }

    // Crear o actualizar registro de payment
    let payment = await this.paymentRepository.findOne({
      where: { mercadoPagoId: mercadoPagoPaymentId.toString() },
    });

    const now = DateUtil.nowUTC(); // Se guarda en UTC automáticamente
    const periodStart = now;
    const periodEnd = DateUtil.addMonth(now, 1); // 1 mes de suscripción

    if (!payment) {
      // Crear nuevo payment
      payment = this.paymentRepository.create({
        subscriptionId: subscription.id,
        userId: subscription.userId,
        amount: paymentInfo.transaction_amount,
        currency: paymentInfo.currency_id,
        status: this.mapMercadoPagoStatus(status),
        mercadoPagoId: mercadoPagoPaymentId.toString(),
        mercadoPagoStatus: status,
        paymentMethod: paymentInfo.payment_method_id,
        paymentType: paymentInfo.payment_type_id,
        periodStart,
        periodEnd,
        billingDate: now,
        description: `Pago de suscripción ${paymentInfo.metadata.plan}`,
      });
    } else {
      // Actualizar payment existente
      payment.status = this.mapMercadoPagoStatus(status);
      payment.mercadoPagoStatus = status;
    }

    // Si el pago fue aprobado
    if (status === 'approved') {
      payment.paidAt = now;

      // Actualizar subscription
      subscription.plan = paymentInfo.metadata.plan;
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.startDate = now; // Reinicia el periodo de la suscripción
      subscription.updatedAt = now;
      subscription.endDate = periodEnd;
      subscription.nextBillingDate = periodEnd;

      await this.subscriptionRepository.save(subscription);

      console.log('✅ Subscription actualizada a:', subscription.plan);
    }

    await this.paymentRepository.save(payment);

    console.log('💾 Payment guardado:', payment.id);

    return payment;
  }

  // ============================================
  // OBTENER INFO DE PAGO DESDE MERCADO PAGO
  // ============================================
  private async getMercadoPagoPayment(paymentId: string) {
    const accessToken = this.configService.get('mercadopago.accessToken');

    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return response.data;
  }

  // ============================================
  // MAPEAR ESTADOS DE MERCADO PAGO
  // ============================================
  private mapMercadoPagoStatus(mpStatus: string): PaymentStatus {
    const statusMap = {
      approved: PaymentStatus.APPROVED,
      pending: PaymentStatus.PENDING,
      in_process: PaymentStatus.PENDING,
      rejected: PaymentStatus.FAILED,
      cancelled: PaymentStatus.CANCELLED,
      refunded: PaymentStatus.REFUNDED,
      charged_back: PaymentStatus.REFUNDED,
    };

    return statusMap[mpStatus] || PaymentStatus.PENDING;
  }

  // ============================================
  // CREAR SUBSCRIPTION GRATUITA
  // ============================================
  private async createFreeSubscription(userId: string) {
    let subscription = await this.subscriptionRepository.findOne({
      where: { userId },
    });

    if (!subscription) {
      subscription = this.subscriptionRepository.create({
        userId,
        plan: SubscriptionPlan.BRONCE,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: null, // Plan gratis no expira
      });
      await this.subscriptionRepository.save(subscription);
    }

    return subscription;
  }

  // ============================================
  // VERIFICAR LÍMITE DE POSTS
  // ============================================
  async canUserPost(userId: string): Promise<boolean> {
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
  // OBTENER SUSCRIPCIÓN DEL USUARIO
  // ============================================
  async getUserSubscription(userId: string) {
    return await this.subscriptionRepository.findOne({ where: { userId } });
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
