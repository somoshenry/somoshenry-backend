import { Injectable } from '@nestjs/common';
import { MercadopagoMapper } from './mercadopago.mapper';
import { RequestPreferenceDto } from './dto/request.preference.dto';
import { ResponsePreferenceDto } from './dto/responce.preference.dto';
import { MercadopagoConnector } from './mercadopago.connector';
import { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes';
import { MercadoPagoWebhookBody } from './mercadopago.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Payment } from '../subscription/entities/payment.entity';
import { DateUtil } from 'src/common/utils/date.util';
import { User } from '../user/entities/user.entity';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../subscription/entities/subscription.entity';
import { NotificationsService } from '../notifications/notifications.service';

type MercadoPagoItem = {
  title?: string | null;
};

type MercadoPagoAdditionalInfo = {
  items?: MercadoPagoItem[];
};

@Injectable()
export class MercadoPagoService {
  constructor(
    private percadopagoConnector: MercadopagoConnector,
    private mercadopagoMapper: MercadopagoMapper,
    private readonly dataSource: DataSource,

    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    private notificationService: NotificationsService,
  ) {}

  async createPaymentPreference(
    body: RequestPreferenceDto,
  ): Promise<ResponsePreferenceDto> {
    try {
      console.log('🚀 Creando preferencia de pago en Mercado Pago', body);
      const preferenceCreateData =
        this.mercadopagoMapper.mapToPreferenceCreateData(body);

      const preferenceResponse =
        await this.percadopagoConnector.createPaymentPreference(
          preferenceCreateData,
        );

      console.log(preferenceResponse);

      return this.mercadopagoMapper.mapToResponsePreferenceDto(
        preferenceResponse,
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async webhook(body: MercadoPagoWebhookBody) {
    try {
      const topic = body.topic || body.type;
      let resourceId = body.data?.id || body.id;

      if (!resourceId && body.resource) {
        const parts = body.resource.split('/');
        resourceId = parts[parts.length - 1].toString();
        console.log(`ID extraído de 'resource': ${resourceId}`);
      }

      if (!resourceId) {
        console.warn(
          'No se pudo obtener el ID del recurso. Terminando procesamiento',
        );
        return { success: true, received: true };
      }

      console.log(
        `Webhook recibido. Tema: ${topic}, Recurso ID: ${resourceId}`,
      );

      if (topic === 'payment') {
        await this.processPaymentNotification(resourceId);
      }

      if (topic === 'merchant_order') {
        console.log('Procesando ORDEN DE COMERCIO (Merchant Order)');
        const orderDetails =
          await this.percadopagoConnector.getMerchantOrderDetails(resourceId);

        if (orderDetails.payments && orderDetails.payments.length > 0) {
          const paymentId = orderDetails.payments[0].id as number;
          const paymentIdString = paymentId.toString();
          console.log(`Pago asociado encontrado: ${paymentId}`);
          const paymentDetails =
            await this.percadopagoConnector.getPaymentDetails(paymentIdString);
          console.log('Detalles del pago obtenidos:', paymentDetails);
        }
      }

      return { success: true, received: true };
    } catch (error) {
      console.error('Error fatal en Webhook:', error);
      return { success: false, error: 'Internal error', received: true };
    }
  }

  private async processPaymentNotification(paymentId: string) {
    const paymentDetails =
      await this.percadopagoConnector.getPaymentDetails(paymentId);
    console.log('Detalles del pago obtenidos:', paymentDetails);
    const { status } = paymentDetails;
    if (status === 'approved') {
      await this.handleApprovedPayment(paymentDetails);
    } else if (status === 'rejected') {
      await this.handleRejectedPayment(paymentDetails);
    } else if (status === 'pending') {
      await this.handlePendingPayment(paymentDetails);
    }
  }

  private async handleApprovedPayment(paymentDetails: PaymentResponse) {
    const {
      id,
      status,
      status_detail,
      transaction_amount,
      currency_id,
      payment_method_id,
      payment_type_id,
      external_reference,
    } = paymentDetails;

    console.log(`PAGO APROBADO ID: ${id}. Detalle: ${status_detail}`);

    const userContext = await this.getUserAndSubscription(external_reference);
    if (!userContext) {
      return;
    }

    const { user, subscription } = userContext;
    const purchasedPlan = this.resolvePlanFromPayment(paymentDetails);
    const now = DateUtil.nowUTC();
    const nextMonth = DateUtil.addMonth(now, 1);
    const nextBillingDate = DateUtil.addDays(nextMonth, -1);

    // ✅ Verificar ANTES de la transacción si el pago ya existe
    const paymentExists = await this.paymentRepository.findOne({
      where: { mercadoPagoId: id?.toString() },
    });

    // ✅ Guardar en base de datos dentro de una transacción
    await this.executeInTransaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);
      const subscriptionRepo = manager.getRepository(Subscription);

      const paymentRecord = paymentRepo.create({
        userId: user.id,
        subscriptionId: subscription.id,
        amount: transaction_amount,
        currency: currency_id || 'USD',
        status,
        mercadoPagoId: id?.toString(),
        mercadoPagoStatus: status_detail,
        paymentMethod: payment_method_id,
        paymentType: payment_type_id,
        periodStart: now,
        periodEnd: nextMonth,
        billingDate: nextBillingDate,
        description: `Pago de suscripción - ${purchasedPlan}`,
        paidAt: now,
      });

      await paymentRepo.upsert(paymentRecord, {
        conflictPaths: ['mercadoPagoId'],
      });

      const updatedSubscription = subscriptionRepo.create({
        ...subscription,
        plan: purchasedPlan,
        startDate: now,
        updatedAt: now,
        endDate: nextMonth,
        nextBillingDate,
        status: SubscriptionStatus.ACTIVE,
      });

      await subscriptionRepo.save(updatedSubscription);
    });

    // ✅ Enviar notificación SOLO si es un pago nuevo (DESPUÉS de la transacción)
    if (!paymentExists) {
      await this.sendNotificationSafely(() =>
        this.notificationService.sendPaymentSuccessNotification(user.email),
      );
      console.log(`📧 Notificación de pago exitoso enviada a ${user.email}`);
    } else {
      console.log(`⚠️ Pago duplicado detectado. No se envió notificación.`);
    }

    console.log(`✅ Subscripción actualizada → Plan: ${purchasedPlan}`);
  }

  private async handleRejectedPayment(paymentDetails: PaymentResponse) {
    const {
      id,
      status,
      status_detail,
      transaction_amount,
      currency_id,
      payment_method_id,
      payment_type_id,
      external_reference,
    } = paymentDetails;

    console.error(`PAGO RECHAZADO ID: ${id}. Motivo: ${status_detail}`);

    const userContext = await this.getUserAndSubscription(external_reference);
    if (!userContext) {
      return;
    }

    const { user, subscription } = userContext;
    const now = DateUtil.nowUTC();
    const shouldExpireSubscription =
      subscription.plan !== SubscriptionPlan.BRONCE;

    await this.executeInTransaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);
      const subscriptionRepo = manager.getRepository(Subscription);

      const paymentRecord = paymentRepo.create({
        userId: user.id,
        subscriptionId: subscription.id,
        amount: transaction_amount,
        currency: currency_id || 'USD',
        status,
        mercadoPagoId: id?.toString(),
        mercadoPagoStatus: status_detail,
        paymentMethod: payment_method_id,
        paymentType: payment_type_id,
        periodStart: now,
        description: `Pago rechazado - ${subscription.plan}`,
        failureReason: status_detail,
      });

      await paymentRepo.upsert(paymentRecord, {
        conflictPaths: ['mercadoPagoId'],
      });

      if (shouldExpireSubscription) {
        const expiredSubscription = subscriptionRepo.create({
          ...subscription,
          status: SubscriptionStatus.EXPIRED,
          endDate: now,
          updatedAt: now,
        });

        await subscriptionRepo.save(expiredSubscription);
      }
    });

    await this.sendNotificationSafely(() =>
      this.notificationService.sendPaymentRejectedNotification(user.email),
    );

    if (shouldExpireSubscription) {
      console.log('Suscripción expirada por rechazo de pago');
    }
  }

  private async handlePendingPayment(paymentDetails: PaymentResponse) {
    const {
      id,
      status,
      status_detail,
      transaction_amount,
      currency_id,
      payment_method_id,
      payment_type_id,
      external_reference,
    } = paymentDetails;

    console.warn(`PAGO PENDIENTE ID: ${id}. Detalle: ${status_detail}`);

    const userContext = await this.getUserAndSubscription(external_reference);
    if (!userContext) {
      return;
    }

    const { user, subscription } = userContext;
    const now = DateUtil.nowUTC();

    await this.executeInTransaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);

      const paymentRecord = paymentRepo.create({
        userId: user.id,
        subscriptionId: subscription.id,
        amount: transaction_amount,
        currency: currency_id || 'USD',
        status,
        mercadoPagoId: id?.toString(),
        mercadoPagoStatus: status_detail,
        paymentMethod: payment_method_id,
        paymentType: payment_type_id,
        periodStart: now,
        description: `Pago pendiente - ${subscription.plan}`,
      });

      await paymentRepo.upsert(paymentRecord, {
        conflictPaths: ['mercadoPagoId'],
      });
    });

    console.log('Pago pendiente registrado en BD.');
  }

  private async getUserAndSubscription(
    externalReference?: string | null,
  ): Promise<{ user: User; subscription: Subscription } | null> {
    if (!externalReference) {
      console.error('No vino external_reference en el pago');
      return null;
    }

    const user = await this.userRepository.findOne({
      where: { id: externalReference },
    });

    if (!user) {
      console.error('No existe el usuario con id:', externalReference);
      return null;
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { userId: user.id },
    });

    if (!subscription) {
      console.error(`El usuario ${user.id} no tiene subscripción`);
      return null;
    }

    return { user, subscription };
  }

  private resolvePlanFromPayment(
    paymentDetails: PaymentResponse,
  ): SubscriptionPlan {
    const additionalInfo = paymentDetails.additional_info as
      | MercadoPagoAdditionalInfo
      | undefined;
    const title = additionalInfo?.items?.[0]?.title;

    if (!title) {
      return SubscriptionPlan.BRONCE;
    }

    const normalized = title.toUpperCase();
    const knownPlans = Object.values(SubscriptionPlan) as string[];

    if (knownPlans.includes(normalized)) {
      return normalized as SubscriptionPlan;
    }

    return SubscriptionPlan.BRONCE;
  }

  private async executeInTransaction<T>(
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(work);
  }

  private async sendNotificationSafely(action: () => Promise<unknown>) {
    try {
      await action();
    } catch (error) {
      console.error('No se pudo enviar la notificación de pago:', error);
    }
  }
}
