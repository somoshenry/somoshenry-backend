import { Injectable } from '@nestjs/common';
import { MercadopagoMapper } from './mercadopago.mapper';
import { RequestPreferenceDto } from './request.preference.dto';
import { ResponsePreferenceDto } from './responce.preference.dto';
import { MercadopagoConnector } from './mercadopago.connector';
import { MerchantOrderResponse } from 'mercadopago/dist/clients/merchantOrder/commonTypes';
import { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes';

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
  async getPaymentDetails(paymentId: string): Promise<PaymentResponse> {
    return await this.percadopagoConnector.getPaymentDetails(paymentId);
  }

  async getMerchantOrderDetails(
    resourceId: string,
  ): Promise<MerchantOrderResponse> {
    return await this.percadopagoConnector.getMerchantOrderDetails(resourceId);
  }

  async processPaymentNotification(paymentId: string) {
    const paymentDetails =
      await this.percadopagoConnector.getPaymentDetails(paymentId);

    const { status, status_detail, transaction_amount } = paymentDetails;

    console.log(`\n--- Detalles del Pago ${paymentId} ---`);
    console.log('💰 Estado:', status);
    console.log('📋 Status detail:', status_detail);
    console.log('💵 Monto:', transaction_amount);
    console.log('------------------------------------\n');

    if (status === 'approved') {
      // Lógica de negocio para una aprobación
      this.handleApprovedPayment(paymentDetails);
    } else if (status === 'rejected') {
      // Lógica de negocio para un rechazo
      this.handleRejectedPayment(paymentDetails);
    } else if (status === 'pending') {
      // Lógica para pagos que esperan confirmación (ej. transferencias)
      this.handlePendingPayment(paymentDetails);
    }
  }

  // --- Manejadores de Estado ---

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
