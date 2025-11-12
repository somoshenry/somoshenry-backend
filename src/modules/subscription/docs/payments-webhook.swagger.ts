import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiHeader } from '@nestjs/swagger';

/**
 * POST /payments/webhook - Webhook de Mercado Pago
 *
 * ⚠️ IMPORTANTE: Este endpoint NO debe ser llamado manualmente.
 * Es utilizado exclusivamente por Mercado Pago para notificar el estado de los pagos.
 */
export function ApiMercadoPagoWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: '📥 Webhook de Mercado Pago',
      description: `
⚠️ **ENDPOINT INTERNO - NO LLAMAR MANUALMENTE**

Este endpoint es usado exclusivamente por Mercado Pago para enviar notificaciones automáticas sobre el estado de los pagos.

**Flujo:**
1. Usuario completa el pago en Mercado Pago
2. Mercado Pago envía una notificación POST a este endpoint
3. El backend procesa la notificación y actualiza:
   - El estado del Payment en la BD
   - La Subscription del usuario
4. El usuario obtiene acceso al plan pagado

**Eventos que notifica:**
- payment.created
- payment.updated
- payment.approved
- payment.rejected

**Configuración:**
Este webhook debe estar configurado en el panel de Mercado Pago:
https://www.mercadopago.com.ar/developers/panel/app/webhooks

**URL del webhook:**
- Desarrollo: https://your-ngrok-url.ngrok-free.app/api/payments/webhook
- Producción: https://somoshenry-backend.onrender.com/api/payments/webhook

**Testing con ngrok:**
1. Instalar ngrok: npm install -g ngrok
2. Iniciar backend: npm run start:dev
3. Crear túnel: ngrok http 3000
4. Configurar URL en Mercado Pago
5. Ver logs en: http://127.0.0.1:4040
      `,
    }),
    ApiHeader({
      name: 'x-signature',
      description:
        'Firma de seguridad enviada por Mercado Pago para validar la autenticidad de la notificación',
      required: false,
      schema: {
        type: 'string',
        example: 'v1=abc123...',
      },
    }),
    ApiBody({
      description: 'Notificación de Mercado Pago con información del pago',
      schema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['payment', 'merchant_order'],
            example: 'payment',
            description: 'Tipo de notificación recibida',
          },
          data: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: '1234567890',
                description:
                  'ID del pago en Mercado Pago que debe ser consultado mediante la API',
              },
            },
            required: ['id'],
          },
          action: {
            type: 'string',
            example: 'payment.updated',
            description: 'Acción que generó la notificación',
            enum: [
              'payment.created',
              'payment.updated',
              'payment.approved',
              'payment.rejected',
            ],
          },
          date_created: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-15T14:30:00.000Z',
            description: 'Fecha de creación de la notificación',
          },
          live_mode: {
            type: 'boolean',
            example: false,
            description:
              'Si es true, es un pago real. Si es false, es de prueba (TEST)',
          },
          user_id: {
            type: 'string',
            example: '2967395160',
            description: 'ID del usuario en Mercado Pago',
          },
        },
        required: ['type', 'data'],
        example: {
          type: 'payment',
          data: {
            id: '1234567890',
          },
          action: 'payment.updated',
          date_created: '2025-01-15T14:30:00.000Z',
          live_mode: false,
          user_id: '2967395160',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Notificación procesada correctamente',
      schema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'ok',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description:
        'Notificación inválida - Formato incorrecto o datos faltantes',
      schema: {
        example: {
          statusCode: 400,
          message: 'Invalid webhook payload',
          error: 'Bad Request',
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Error interno al procesar la notificación',
      schema: {
        example: {
          statusCode: 500,
          message: 'Error processing payment notification',
          error: 'Internal Server Error',
        },
      },
    }),
  );
}
