import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../subscription/entities/subscription.entity';
import { Payment } from '../subscription/entities/payment.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
  ) {}

  /**
   * 🎫 Crea o renueva una subscripción basada en un pago aprobado
   * ADAPTADO A TU ESTRUCTURA DE ENTIDADES
   *
   * LÓGICA:
   * - Si el usuario ya tiene una subscripción activa → EXTIENDE la fecha de fin
   * - Si el usuario NO tiene subscripción activa → CREA una nueva
   */
  async createOrRenewSubscription(
    payment: Payment,
    planType: string,
  ): Promise<Subscription> {
    const userId = payment.userId;

    if (!userId) {
      throw new Error('Payment does not have a userId associated');
    }

    // Convertir planType string a tu enum SubscriptionPlan
    const plan = this.mapPlanTypeToEnum(planType);

    // Buscar subscripción activa del usuario (única por userId)
    const activeSubscription = await this.subscriptionsRepository.findOne({
      where: {
        userId: userId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    const now = new Date();
    const durationDays = this.getPlanDurationDays(planType);

    if (activeSubscription) {
      // ♻️ RENOVAR: Extender la fecha de fin
      console.log(`♻️ Renovando subscripción existente para usuario ${userId}`);

      // Calcular nueva fecha de fin desde la fecha actual de fin
      const currentEnd = activeSubscription.endDate
        ? new Date(activeSubscription.endDate)
        : now;
      const baseDate = currentEnd > now ? currentEnd : now; // Si ya expiró, partir desde ahora
      const newEnd = new Date(baseDate);
      newEnd.setDate(newEnd.getDate() + durationDays);

      activeSubscription.endDate = newEnd;
      activeSubscription.plan = plan; // Actualizar el plan por si cambió
      activeSubscription.nextBillingDate = newEnd; // Próxima fecha de cobro
      activeSubscription.autoRenew = true; // Reactivar auto-renovación si estaba cancelada
      activeSubscription.updatedAt = now;

      return await this.subscriptionsRepository.save(activeSubscription);
    } else {
      // 🆕 CREAR NUEVA subscripción
      console.log(`🆕 Creando nueva subscripción para usuario ${userId}`);

      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + durationDays);

      const newSubscription = this.subscriptionsRepository.create({
        userId: userId,
        plan: plan,
        status: SubscriptionStatus.ACTIVE,
        startDate: now,
        endDate: endDate,
        nextBillingDate: endDate, // Próxima fecha de cobro
        autoRenew: true,
        cancelledAt: null,
        cancellationReason: null,
      });

      return await this.subscriptionsRepository.save(newSubscription);
    }
  }

  /**
   * 🔄 Convierte el planType string a tu enum SubscriptionPlan
   */
  private mapPlanTypeToEnum(planType: string): SubscriptionPlan {
    const planMap: Record<string, SubscriptionPlan> = {
      // Planes en español
      bronce: SubscriptionPlan.BRONCE,
      plata: SubscriptionPlan.PLATA,
      oro: SubscriptionPlan.ORO,

      // Planes en inglés (por si vienen así)
      bronze: SubscriptionPlan.BRONCE,
      silver: SubscriptionPlan.PLATA,
      gold: SubscriptionPlan.ORO,

      // Alias adicionales
      basic: SubscriptionPlan.BRONCE,
      standard: SubscriptionPlan.PLATA,
      premium: SubscriptionPlan.ORO,
      pro: SubscriptionPlan.ORO,
    };

    const normalizedPlanType = planType.toLowerCase();
    return planMap[normalizedPlanType] || SubscriptionPlan.BRONCE; // Default: BRONCE
  }

  /**
   * 🗓️ Obtiene la duración en días según el tipo de plan
   */
  private getPlanDurationDays(planType: string): number {
    const durations: Record<string, number> = {
      // Planes por periodo
      monthly: 30,
      quarterly: 90,
      yearly: 365,

      // Planes por nivel (asumiendo todos son mensuales por defecto)
      bronce: 30,
      plata: 30,
      oro: 30,
      bronze: 30,
      silver: 30,
      gold: 30,
      basic: 30,
      standard: 30,
      premium: 30,
      pro: 30,

      // Planes personalizados
      trial: 7,
      weekly: 7,
    };

    return durations[planType.toLowerCase()] || 30; // Default: 30 días
  }

  /**
   * ❌ Cancela una subscripción de un usuario
   */
  async cancelSubscription(
    userId: string,
    reason?: string,
  ): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: {
        userId: userId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (!subscription) {
      throw new NotFoundException(
        `No active subscription found for user ${userId}`,
      );
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();
    subscription.cancellationReason =
      reason || 'Usuario canceló la subscripción';
    subscription.autoRenew = false;

    const cancelledSubscription =
      await this.subscriptionsRepository.save(subscription);

    console.log(`❌ Subscripción cancelada para usuario ${userId}`);

    return cancelledSubscription;
  }

  /**
   * ✅ Verifica si un usuario tiene una subscripción activa y válida
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: {
        userId: userId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (!subscription) {
      return false;
    }

    const now = new Date();

    // Verificar que no haya expirado
    if (subscription.endDate && subscription.endDate < now) {
      console.log(
        `⏰ Subscripción de usuario ${userId} expiró. Actualizando estado...`,
      );

      // Marcar como expirada automáticamente
      subscription.status = SubscriptionStatus.EXPIRED;
      await this.subscriptionsRepository.save(subscription);

      return false;
    }

    return true;
  }

  /**
   * 📋 Obtiene la subscripción activa de un usuario
   */
  async getActiveSubscription(userId: string): Promise<Subscription | null> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: {
        userId: userId,
        status: SubscriptionStatus.ACTIVE,
        endDate: MoreThan(new Date()), // Solo si no ha expirado
      },
      relations: ['payments', 'user'],
    });

    return subscription;
  }

  /**
   * 🔍 Obtiene la subscripción de un usuario (sin importar el estado)
   */
  async getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    return await this.subscriptionsRepository.findOne({
      where: { userId: userId },
      relations: ['payments', 'user'],
    });
  }

  /**
   * 📊 Obtiene el historial completo de subscripciones de un usuario
   * Nota: En tu schema userId es único, así que solo habrá una subscripción por usuario
   * Este método es útil si en el futuro permites múltiples subscripciones
   */
  async getUserSubscriptionHistory(userId: string): Promise<Subscription[]> {
    return await this.subscriptionsRepository.find({
      where: { userId: userId },
      order: { createdAt: 'DESC' },
      relations: ['payments', 'user'],
    });
  }

  /**
   * 🔍 Busca una subscripción por ID
   */
  async findById(subscriptionId: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { id: subscriptionId },
      relations: ['payments', 'user'],
    });

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with ID ${subscriptionId} not found`,
      );
    }

    return subscription;
  }

  /**
   * 📈 Obtiene estadísticas de subscripciones
   */
  async getSubscriptionStats() {
    const [active, expired, cancelled, total] = await Promise.all([
      this.subscriptionsRepository.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      this.subscriptionsRepository.count({
        where: { status: SubscriptionStatus.EXPIRED },
      }),
      this.subscriptionsRepository.count({
        where: { status: SubscriptionStatus.CANCELLED },
      }),
      this.subscriptionsRepository.count(),
    ]);

    // Contar por plan
    const [bronce, plata, oro] = await Promise.all([
      this.subscriptionsRepository.count({
        where: {
          plan: SubscriptionPlan.BRONCE,
          status: SubscriptionStatus.ACTIVE,
        },
      }),
      this.subscriptionsRepository.count({
        where: {
          plan: SubscriptionPlan.PLATA,
          status: SubscriptionStatus.ACTIVE,
        },
      }),
      this.subscriptionsRepository.count({
        where: {
          plan: SubscriptionPlan.ORO,
          status: SubscriptionStatus.ACTIVE,
        },
      }),
    ]);

    return {
      total,
      active,
      expired,
      cancelled,
      by_plan: {
        bronce,
        plata,
        oro,
      },
    };
  }

  /**
   * ⏰ CRON JOB: Revisa y marca como expiradas las subscripciones vencidas
   * Se ejecuta cada día a las 00:00
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiredSubscriptions() {
    console.log('🔍 Verificando subscripciones expiradas...');

    const now = new Date();

    // Buscar todas las subscripciones activas que ya expiraron
    const expiredSubscriptions = await this.subscriptionsRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: LessThan(now),
      },
    });

    if (expiredSubscriptions.length === 0) {
      console.log('✅ No hay subscripciones expiradas');
      return;
    }

    // Marcar todas como expiradas
    for (const subscription of expiredSubscriptions) {
      subscription.status = SubscriptionStatus.EXPIRED;
      await this.subscriptionsRepository.save(subscription);
    }

    console.log(
      `⏰ ${expiredSubscriptions.length} subscripciones marcadas como expiradas`,
    );
  }

  /**
   * 🔔 Obtiene subscripciones que están por vencer (próximos X días)
   * Útil para enviar notificaciones de renovación
   */
  async getSubscriptionsExpiringSoon(days = 7): Promise<Subscription[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await this.subscriptionsRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: LessThan(futureDate),
      },
      relations: ['payments', 'user'],
    });
  }

  /**
   * 🔄 Actualiza el plan de una subscripción
   */
  async updatePlan(userId: string, newPlanType: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { userId: userId, status: SubscriptionStatus.ACTIVE },
    });

    if (!subscription) {
      throw new NotFoundException(
        `No active subscription found for user ${userId}`,
      );
    }

    const newPlan = this.mapPlanTypeToEnum(newPlanType);
    subscription.plan = newPlan;

    return await this.subscriptionsRepository.save(subscription);
  }

  /**
   * 🔄 Reactiva una subscripción cancelada
   */
  async reactivateSubscription(userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { userId: userId, status: SubscriptionStatus.CANCELLED },
    });

    if (!subscription) {
      throw new NotFoundException(
        `No cancelled subscription found for user ${userId}`,
      );
    }

    // Verificar si la subscripción todavía está en periodo válido
    const now = new Date();
    if (subscription.endDate && subscription.endDate > now) {
      // Todavía está en periodo válido, solo reactivar
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.autoRenew = true;
      subscription.cancelledAt = null;
      subscription.cancellationReason = null;
    } else {
      // Ya expiró, necesita crear una nueva (extender)
      const durationDays = this.getPlanDurationDays(subscription.plan);
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.startDate = now;
      subscription.endDate = new Date(now);
      subscription.endDate.setDate(
        subscription.endDate.getDate() + durationDays,
      );
      subscription.nextBillingDate = subscription.endDate;
      subscription.autoRenew = true;
      subscription.cancelledAt = null;
      subscription.cancellationReason = null;
    }

    const reactivated = await this.subscriptionsRepository.save(subscription);

    console.log(`✅ Subscripción reactivada para usuario ${userId}`);

    return reactivated;
  }

  /**
   * 🔄 Desactiva la auto-renovación
   */
  async disableAutoRenew(userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { userId: userId, status: SubscriptionStatus.ACTIVE },
    });

    if (!subscription) {
      throw new NotFoundException(
        `No active subscription found for user ${userId}`,
      );
    }

    subscription.autoRenew = false;

    return await this.subscriptionsRepository.save(subscription);
  }

  /**
   * ✅ Activa la auto-renovación
   */
  async enableAutoRenew(userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { userId: userId, status: SubscriptionStatus.ACTIVE },
    });

    if (!subscription) {
      throw new NotFoundException(
        `No active subscription found for user ${userId}`,
      );
    }

    subscription.autoRenew = true;

    return await this.subscriptionsRepository.save(subscription);
  }
}
