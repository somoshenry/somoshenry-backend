// src/mercado-pago/interfaces/mercado-pago.interface.ts
export interface MercadoPagoWebhookData {
  id?: string; // ID del recurso (e.g., payment_id)
}
/**
 * 🎯 Tipo Base para cualquier notificación de Webhook de Mercado Pago
 * La estructura varía ligeramente entre los webhooks legacy y los actuales.
 */
export interface MercadoPagoWebhookBody {
  // Para webhooks de 'payment' (usado en la mayoría de las notificaciones)
  id?: string;
  type?: string;
  data?: MercadoPagoWebhookData;

  // Para webhooks de 'merchant_order' (usado en notificaciones más antiguas/recursos)
  resource?: string; // URL del recurso: /v1/payments/35308503916 o /v1/merchant_orders/98765
  topic?: string;

  // Propiedades comunes
  user_id: number;
  application_id: number;
  version: number;
  api_version: string;
  action: string;
}

/**
 * 💳 Tipo Específico para notificación de 'payment'
 * Esta estructura es la más común para notificaciones que te importan.
 */
export interface PaymentWebhookBody extends MercadoPagoWebhookBody {
  topic: 'payment';
  type: 'payment';
  data: MercadoPagoWebhookData;
}

/**
 * 📦 Tipo Específico para notificación de 'merchant_order'
 * Esta estructura usa el campo 'resource' que es una URL.
 */
export interface MerchantOrderWebhookBody extends MercadoPagoWebhookBody {
  topic: 'merchant_order';
  type: 'merchant_order';
  resource: string; // Ejemplo: "/v1/merchant_orders/35308503916"
}
