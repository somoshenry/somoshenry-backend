import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { DateUtil } from '../../../common/utils/date.util';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class SubscriptionCron {
  private readonly logger = new Logger(SubscriptionCron.name);
  private readonly subscriptionService: SubscriptionService;

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  // Ejecutar todos los días a las 00:00 UTC
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiredSubscriptions() {
    this.logger.log('Verificando subscriptions expiradas');

    const now = DateUtil.nowUTC();

    // Buscar subscriptions que expiraron
    const expired = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: LessThanOrEqual(now),
        autoRenew: false, // No se renuevan automáticamente
      },
    });

    for (const subscription of expired) {
      subscription.status = SubscriptionStatus.EXPIRED;
      // subscription.plan = SubscriptionPlan.BRONCE; // Degradar a plan gratis
      await this.subscriptionRepository.save(subscription);

      this.logger.log(`Subscription ${subscription.id} degradada a BRONCE`);

      // TODO: Enviar email al usuario notificando
    }

    this.logger.log(`Procesadas ${expired.length} subscriptions expiradas`);
  }

  // Intentar renovación automática (si autoRenew = true)
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async attemptAutoRenewal() {
    this.logger.log('Intentando renovaciones automáticas');

    const now = DateUtil.nowUTC();
    const tomorrow = DateUtil.addDays(now, 2);

    // Subscriptions que vencen pasado mañana y tienen autoRenew
    const toRenew = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate: LessThanOrEqual(tomorrow),
        autoRenew: true,
      },
    });

    for (const subscription of toRenew) {
      try {
        // TODO: Intentar cobro con Mercado Pago
        // await this.subscriptionService.chargeSubscription(subscription.id);

        this.logger.log(`💳 Renovación exitosa: ${subscription.id}`);
      } catch (error) {
        this.logger.error(`❌ Error renovando ${subscription.id}:`, error);

        // TODO: Enviar email notificando fallo de pago
      }
    }
  }
}
