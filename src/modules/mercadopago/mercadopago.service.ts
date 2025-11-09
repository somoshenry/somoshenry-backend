import { Injectable } from '@nestjs/common';
import { MercadopagoMapper } from './mercadopago.mapper';
import { RequestPreferenceDto } from './request.preference.dto';
import { ResponsePreferenceDto } from './responce.preference.dto';
import { MercadopagoConnector } from './mercadopago.connector';
import { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes';
import { MercadoPagoWebhookBody } from './mercadopago.interface';

@Injectable()
export class MercadoPagoService {
  constructor(
    private percadopagoConnector: MercadopagoConnector,
    private mercadopagoMapper: MercadopagoMapper,
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

  private handleApprovedPayment(paymentDetails: PaymentResponse) {
    const { id, status_detail } = paymentDetails;
    console.log(`✅ PAGO APROBADO ID: ${id}. Detalle: ${status_detail}`);

    // 1. Actualizar estado de la orden en DB a 'Completada'.
    // 2. Enviar correo de confirmación al cliente.
    // 3. Reducir inventario/stock.
    // 4. Iniciar proceso de envío/fulfillment.
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
