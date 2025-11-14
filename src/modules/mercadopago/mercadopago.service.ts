import { Injectable } from '@nestjs/common';
import { MercadopagoMapper } from './mercadopago.mapper';
import { RequestPreferenceDto } from './dto/request.preference.dto';
import { ResponsePreferenceDto } from './dto/responce.preference.dto';
import { MercadopagoConnector } from './mercadopago.connector';
import { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes';
import { MercadoPagoWebhookBody } from './mercadopago.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Payment,
  PaymentStatus,
} from '../subscription/entities/payment.entity';
import { DateUtil } from 'src/common/utils/date.util';

@Injectable()
export class MercadoPagoService {
  constructor(
    private percadopagoConnector: MercadopagoConnector,
    private mercadopagoMapper: MercadopagoMapper,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
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
      this.handleApprovedPayment(paymentDetails);
    } else if (status === 'rejected') {
      this.handleRejectedPayment(paymentDetails);
    } else if (status === 'pending') {
      this.handlePendingPayment(paymentDetails);
    }
  }

  private async handleApprovedPayment(paymentDetails: PaymentResponse) {
    const {
      id,
      status_detail,
      transaction_amount,
      currency_id,
      payment_method_id,
      payment_type_id,
    } = paymentDetails;

    console.log(`✅ PAGO APROBADO ID: ${id}. Detalle: ${status_detail}`);

    // 🔥 ID TEMPORALES PARA TEST
    const fakeUserId = 'd567b2e1-a831-4792-9879-1a7d08723193';
    const fakeSubscriptionId = 'e1bacfdd-12c2-4b70-8b3a-81427bede634';

    // 🔥 Fechas UTC
    const now = DateUtil.nowUTC();
    const nextDay = DateUtil.addDays(now, 1); // renovamos 1 día por test

    // 💾 Crear registro de pago
    const paymentRecord = this.paymentRepository.create({
      subscriptionId: fakeSubscriptionId,
      userId: fakeUserId,
      amount: transaction_amount,
      currency: currency_id || 'USD',

      status: PaymentStatus.APPROVED,
      mercadoPagoId: id?.toString(),
      mercadoPagoStatus: status_detail,
      paymentMethod: payment_method_id,
      paymentType: payment_type_id,

      periodStart: now,
      periodEnd: nextDay,
      billingDate: now,
      description: 'Pago registrado desde webhook (TEST)',
    });

    await this.paymentRepository.save(paymentRecord);

    console.log('💾 Payment guardado en BD →', paymentRecord.id);
  }

  private handleRejectedPayment(paymentDetails: PaymentResponse) {
    const { id, status_detail } = paymentDetails;
    console.error(`❌ PAGO RECHAZADO ID: ${id}. Motivo: ${status_detail}`);

    // 1. **CRÍTICO:** Analizar `status_detail` para dar retroalimentación.
    //    if (status_detail === 'cc_rejected_high_risk') { /* Marcar como sospechoso */ }
    // 2. Registrar el fallo en la base de datos.
    // 3. Notificar al cliente que reintente el pago (sin revelar el motivo de riesgo).
  }

  private handlePendingPayment(paymentDetails: PaymentResponse) {
    const { id, status_detail } = paymentDetails;
    console.warn(`⚠️ PAGO PENDIENTE ID: ${id}. Detalle: ${status_detail}`);

    // 1. Actualizar estado de la orden a 'Pendiente de Pago'.
    // 2. Esperar un futuro Webhook (payment.updated) con estado 'approved' o 'rejected'.
  }
}
