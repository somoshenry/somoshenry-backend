import { Injectable } from '@nestjs/common';
import { MercadopagoMapper } from './mercadopago.mapper';
import { RequestPreferenceDto } from './dto/request.preference.dto';
import { ResponsePreferenceDto } from './dto/responce.preference.dto';
import { MercadopagoConnector } from './mercadopago.connector';
import { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes';
import { MercadoPagoWebhookBody } from './mercadopago.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../subscription/entities/payment.entity';
import { DateUtil } from 'src/common/utils/date.util';
import { User } from '../user/entities/user.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../subscription/entities/subscription.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MercadoPagoService {
  constructor(
    private percadopagoConnector: MercadopagoConnector,
    private mercadopagoMapper: MercadopagoMapper,

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
    const topic = body.topic || body.type;
    let resourceId = body.data?.id || body.id;
    if (!resourceId && body.resource) {
      const parts = body.resource.split('/');
      resourceId = parts[parts.length - 1].toString();
      console.log(`✅ ID extraído de 'resource': ${resourceId}`);
    }

    if (!resourceId) {
      console.warn(
        '⚠️ No se pudo obtener el ID del recurso. Terminando procesamiento',
      );
      return { success: true, received: true };
    }
    console.log(
      `🔔 Webhook recibido. Tema: ${topic}, Recurso ID: ${resourceId}`,
    );
    if (topic === 'payment') {
      await this.processPaymentNotification(resourceId);
    }
    if (topic === 'merchant_order') {
      console.log('📦 Procesando ORDEN DE COMERCIO (Merchant Order)');
      const orderDetails =
        await this.percadopagoConnector.getMerchantOrderDetails(resourceId);

      if (orderDetails.payments && orderDetails.payments.length > 0) {
        const paymentId = orderDetails.payments[0].id as number;
        const paymentIdString = paymentId.toString();
        console.log(`✅ Pago asociado encontrado: ${paymentId}`);
        const paymentDetails =
          await this.percadopagoConnector.getPaymentDetails(paymentIdString);
        console.log('💰 Detalles del pago obtenidos:', paymentDetails);
      }
    }

    return { success: true, received: true };
  }
  catch(error) {
    console.error('❌ Error fatal en Webhook:', error);
    return { success: false, error: 'Internal error', received: true };
  }

  private async processPaymentNotification(paymentId: string) {
    const paymentDetails =
      await this.percadopagoConnector.getPaymentDetails(paymentId);
    console.log('💰 Detalles del pago obtenidos:', paymentDetails);
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
      // payer, // Borrar si se envía external_reference
    } = paymentDetails;

    // Borrar este chequeo si se envía external_reference
    // if (!payer) {
    //   console.error('No hay información del pagador');
    //   return;
    // }
    // Fin borrar

    console.log(`✅ PAGO APROBADO ID: ${id}. Detalle: ${status_detail}`);

    // =============================
    // EXTRAER PLAN DESDE EL ITEM
    // =============================
    let purchasedPlan: string | null = null;
    try {
      // MP pone los ítems en "additional_info.items" --> "paymentDetails.additional_info.items[0].title"
      const items = (paymentDetails as any)?.additional_info?.items;
      if (items && items.length > 0) {
        purchasedPlan = items[0].title; // Ej: "PLATA"
      }
    } catch (err) {
      console.warn('No se pudo leer items desde paymentDetails');
    }
    // fallback: BRONCE
    if (!purchasedPlan) {
      purchasedPlan = 'BRONCE';
    }
    console.log('🛒 Plan adquirido:', purchasedPlan);

    // =============================
    // 1) Obtener userId desde external_reference
    // =============================
    const userId = external_reference;

    if (!userId) {
      console.error('❌ No vino external_reference en el pago');
      return;
    }

    // =============================
    // 2) Obtener al usuario
    // =============================
    const user = await this.userRepository.findOne({
      where: { id: userId },
      // where: { email: payer.email }, // Borrar si se envía external_reference
    });

    if (!user) {
      console.error('❌ No existe el usuario con id:', userId);
      // console.error(
      //   // Borrar este console.error si se envía external_reference
      //   '❌ No existe un usuario con el email del pago:',
      //   payer.email,
      // );
      return;
    }

    // =============================
    // 3) Obtener su subscripción activa
    // =============================
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId: user.id },
    });

    if (!subscription) {
      console.error(`❌ El usuario ${user.id} no tiene subscripción`);
      return;
    }
    console.log('######################################################');
    console.log('######################################################');
    console.log('######################################################');
    console.log('######################################################');
    await this.notificationService.sendPaymentSuccessNotification(user.email);
    console.log(`📧 Notificación de pago exitoso enviada a ${user.email}`);

    // Fechas UTC
    const now = DateUtil.nowUTC();
    const nextMonth = DateUtil.addMonth(now, 1); // Plan válido por 1 mes
    const nextBillingDate = DateUtil.addDays(nextMonth, -1); // Intento de cobro 1 día antes de acabar el mes

    // =============================
    // 4) Crear el registro de pago
    // =============================
    const paymentRecord = this.paymentRepository.create({
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

    await this.paymentRepository.upsert(paymentRecord, {
      conflictPaths: ['mercadoPagoId'],
    });

    console.log('Payment guardado en BD →', paymentRecord.id);

    // =============================
    // 5) Actualizar la subscripción
    // =============================
    const validPlans = ['PLATA', 'ORO', 'BRONCE']; // ACTUALIZAR PLAN SI ES PLATA/ORO/BRONCE

    if (validPlans.includes(purchasedPlan)) {
      subscription.plan = purchasedPlan as any;
    }

    subscription.startDate = now;
    subscription.updatedAt = now;
    subscription.endDate = nextMonth;
    subscription.nextBillingDate = nextBillingDate;
    subscription.status = SubscriptionStatus.ACTIVE;

    await this.subscriptionRepository.save(subscription);

    console.log(`Subscripción actualizada → Plan: ${subscription.plan}`);
  }

  private async handleRejectedPayment(paymentDetails: PaymentResponse) {
    // 1. **CRÍTICO:** Analizar `status_detail` para dar retroalimentación.
    //    if (status_detail === 'cc_rejected_high_risk') { /* Marcar como sospechoso */ }
    // 2. Registrar el fallo en la base de datos.
    // 3. Notificar al cliente que reintente el pago (sin revelar el motivo de riesgo).
    const {
      id,
      status,
      status_detail,
      transaction_amount,
      currency_id,
      payment_method_id,
      payment_type_id,
      external_reference,
      // payer, // Borrar si se envía external_reference
    } = paymentDetails;

    // Borrar este chequeo si se envía external_reference
    // if (!payer) {
    //   console.error('No hay información del pagador');
    //   return;
    // }
    // Fin borrar

    console.error(`❌ PAGO RECHAZADO ID: ${id}. Motivo: ${status_detail}`);

    const userId = external_reference;

    if (!userId)
      return console.error('❌ No vino external_reference en Reject');

    const user = await this.userRepository.findOne({
      where: { id: userId },
      // where: { email: payer.email }, // Borrar si se envía external_reference
    });

    if (!user) {
      console.error('❌ No existe el usuario con id:', userId);
      // console.error(
      //   // Borrar este console.error si se envía external_reference
      //   '❌ No existe un usuario con el email del pago:',
      //   payer.email,
      // );
      return;
    }
    console.log('######################################################');
    console.log('######################################################');
    console.log('######################################################');
    console.log('######################################################');
    await this.notificationService.sendPaymentRejectedNotification(user.email);
    console.log(`📧 Notificación de pago rechazado enviada a ${user.email}`);

    const subscription = await this.subscriptionRepository.findOne({
      where: { userId: user.id },
    });
    if (!subscription)
      return console.error(`❌ El usuario ${user.id} no tiene subscripción`);

    const now = DateUtil.nowUTC();

    const paymentRecord = this.paymentRepository.create({
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
      // periodEnd: null,
      // billingDate: null,
      description: `Pago rechazado - ${subscription.plan}`,
      failureReason: status_detail,
    });

    await this.paymentRepository.upsert(paymentRecord, {
      conflictPaths: ['mercadoPagoId'],
    });

    // SI EL USER ERA PLATA U ORO → EXPIRAR SU PLAN
    if (subscription.plan !== 'BRONCE') {
      subscription.status = SubscriptionStatus.EXPIRED;
      subscription.endDate = now;

      await this.subscriptionRepository.save(subscription);
      console.log('❌ Suscripción expirada por rechazo de pago');
    }
  }

  private async handlePendingPayment(paymentDetails: PaymentResponse) {
    // 1. Actualizar estado de la orden a 'Pendiente de Pago'.
    // 2. Esperar un futuro Webhook (payment.updated) con estado 'approved' o 'rejected'.
    const {
      id,
      status,
      status_detail,
      transaction_amount,
      currency_id,
      payment_method_id,
      payment_type_id,
      external_reference,
      // payer, // Borrar si se envía external_reference
    } = paymentDetails;

    // Borrar este chequeo si se envía external_reference
    // if (!payer) {
    //   console.error('No hay información del pagador');
    //   return;
    // }
    // Fin borrar

    console.warn(`⚠️ PAGO PENDIENTE ID: ${id}. Detalle: ${status_detail}`);

    const userId = external_reference;

    if (!userId)
      return console.error('❌ No vino external_reference en pendiente');

    const user = await this.userRepository.findOne({
      where: { id: userId },
      // where: { email: payer.email }, // Borrar si se envía external_reference
    });

    if (!user) {
      console.error('❌ No existe el usuario con id:', userId);
      // console.error(
      //   // Borrar este console.error si se envía external_reference
      //   '❌ No existe un usuario con el email del pago:',
      //   payer.email,
      // );
      return;
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { userId: user.id },
    });
    if (!subscription)
      return console.error(`❌ El usuario ${user.id} no tiene subscripción`);

    const now = DateUtil.nowUTC();

    const paymentRecord = this.paymentRepository.create({
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
      // periodEnd: null,
      // billingDate: null,

      description: `Pago pendiente - ${subscription.plan}`,
    });

    await this.paymentRepository.upsert(paymentRecord, {
      conflictPaths: ['mercadoPagoId'],
    });

    console.log('🕒 Pago pendiente registrado en BD.');
  }
}
