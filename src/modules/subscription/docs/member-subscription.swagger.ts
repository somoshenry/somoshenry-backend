import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

/**
 * 1️⃣ GET /subscription/me - Ver mi suscripción actual
 */
export function ApiGetMySubscription() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '1️⃣ Ver mi suscripción actual',
      description:
        'Retorna la información completa de la suscripción del usuario autenticado, incluyendo plan actual, fechas de inicio/fin, próximo cobro y estado.',
    }),
    ApiResponse({
      status: 200,
      description: 'Suscripción encontrada exitosamente',
      schema: {
        example: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          userId: '650e8400-e29b-41d4-a716-446655440001',
          plan: 'PLATA',
          status: 'ACTIVE',
          startDate: '2025-01-01T00:00:00.000Z',
          endDate: '2025-02-01T00:00:00.000Z',
          nextBillingDate: '2025-02-01T00:00:00.000Z',
          autoRenew: true,
          cancelledAt: null,
          cancellationReason: null,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado - Token inválido o expirado',
    }),
    ApiResponse({
      status: 404,
      description: 'Suscripción no encontrada para este usuario',
    }),
  );
}

/**
 * 2️⃣ GET /subscription/plans - Ver planes disponibles
 */
export function ApiGetPlans() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '2️⃣ Ver planes disponibles',
      description:
        'Lista todos los planes de suscripción disponibles con sus características, precios y límites.',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de planes obtenida exitosamente',
      schema: {
        example: [
          {
            id: 'BRONCE',
            name: 'Plan Gratis',
            price: 0,
            maxPostsPerMonth: 10,
            features: [
              'Máximo 10 posteos mensuales',
              'Sin prioridad en el muro',
              'Acceso a la comunidad',
              'Perfil básico',
              'Mensajería básica',
            ],
          },
          {
            id: 'PLATA',
            name: 'Nivel 1',
            price: 5,
            currency: 'USD',
            maxPostsPerMonth: 50,
            features: [
              'Hasta 50 publicaciones al mes',
              'Prioridad media en el muro',
              'Acceso a eventos exclusivos',
              'Perfil destacado',
              'Soporte prioritario',
              'Sin anuncios',
            ],
          },
          {
            id: 'ORO',
            name: 'Nivel 2',
            price: 10,
            currency: 'USD',
            maxPostsPerMonth: -1,
            features: [
              'Publicaciones ilimitadas',
              'Máxima prioridad en el muro',
              'Acceso VIP a todos los eventos',
              'Perfil premium destacado',
              'Soporte 24/7 prioritario',
              'Insignia exclusiva',
              'Acceso anticipado a nuevas funciones',
              'Análisis de engagement',
            ],
          },
        ],
      },
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado',
    }),
  );
}

/**
 * 3️⃣ POST /subscription/upgrade - Mejorar plan de suscripción
 */
export function ApiUpgradePlan() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '3️⃣ Mejorar plan de suscripción',
      description:
        'Crea una preferencia de pago en Mercado Pago para cambiar a un plan superior. Retorna el link de pago donde el usuario será redirigido.',
    }),
    ApiBody({
      description: 'Plan al que desea actualizar',
      schema: {
        type: 'object',
        properties: {
          plan: {
            type: 'string',
            enum: ['BRONCE', 'PLATA', 'ORO'],
            example: 'PLATA',
            description: 'Plan de destino',
          },
        },
        required: ['plan'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Preferencia de pago creada exitosamente',
      schema: {
        example: {
          subscriptionId: '550e8400-e29b-41d4-a716-446655440000',
          preferenceId: 'mp-1234567890',
          initPoint:
            'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...',
          sandboxInitPoint:
            'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=...',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Plan inválido o datos incorrectos',
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado',
    }),
  );
}

/**
 * 4️⃣ POST /subscription/cancel - Cancelar suscripción
 */
export function ApiCancelSubscription() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '4️⃣ Cancelar suscripción',
      description:
        'Cancela la renovación automática de la suscripción. El usuario mantiene acceso premium hasta el fin del período ya pagado.',
    }),
    ApiBody({
      description: 'Razón de cancelación (opcional)',
      schema: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            example: 'No uso la plataforma con frecuencia',
            description: 'Motivo de cancelación',
          },
        },
      },
      required: false,
    }),
    ApiResponse({
      status: 200,
      description: 'Suscripción cancelada exitosamente',
      schema: {
        example: {
          message:
            'Suscripción cancelada. Seguirás teniendo acceso hasta el fin del período.',
          endsAt: '2025-02-01T00:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Suscripción no encontrada',
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado',
    }),
  );
}

/**
 * 5️⃣ POST /subscription/reactivate - Reactivar suscripción
 */
export function ApiReactivateSubscription() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '5️⃣ Reactivar suscripción cancelada',
      description:
        'Reactiva la renovación automática de una suscripción previamente cancelada.',
    }),
    ApiResponse({
      status: 200,
      description: 'Suscripción reactivada exitosamente',
      schema: {
        example: {
          message: 'Suscripción reactivada',
          nextBillingDate: '2025-02-01T00:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Suscripción no encontrada',
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado',
    }),
  );
}

/**
 * 6️⃣ GET /subscription/payments - Ver historial de pagos
 */
export function ApiGetMyPayments() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '6️⃣ Ver mi historial de pagos',
      description:
        'Lista todos los pagos realizados por el usuario con paginación.',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      example: 1,
      description: 'Número de página',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      example: 10,
      description: 'Cantidad de resultados por página',
    }),
    ApiResponse({
      status: 200,
      description: 'Historial de pagos obtenido exitosamente',
      schema: {
        example: {
          data: [
            {
              id: '650e8400-e29b-41d4-a716-446655440002',
              subscriptionId: '550e8400-e29b-41d4-a716-446655440000',
              userId: '650e8400-e29b-41d4-a716-446655440001',
              amount: 5.0,
              currency: 'USD',
              status: 'APPROVED',
              mercadoPagoId: '1234567890',
              mercadoPagoStatus: 'approved',
              paymentMethod: 'credit_card',
              paymentType: 'credit_card',
              periodStart: '2025-01-01T00:00:00.000Z',
              periodEnd: '2025-02-01T00:00:00.000Z',
              billingDate: '2025-01-01T00:00:00.000Z',
              paidAt: '2025-01-01T10:30:00.000Z',
              createdAt: '2025-01-01T10:00:00.000Z',
              updatedAt: '2025-01-01T10:30:00.000Z',
            },
          ],
          meta: {
            page: 1,
            limit: 10,
            total: 15,
            totalPages: 2,
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado',
    }),
  );
}

/**
 * 7️⃣ GET /subscription/payments/:id/receipt - Descargar recibo de pago
 */
export function ApiGetPaymentReceipt() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '7️⃣ Descargar recibo de pago',
      description:
        'Obtiene la información detallada de un pago específico para generar el recibo.',
    }),
    ApiParam({
      name: 'id',
      type: String,
      description: 'ID del pago',
      example: '650e8400-e29b-41d4-a716-446655440002',
    }),
    ApiResponse({
      status: 200,
      description: 'Información del recibo obtenida',
      schema: {
        example: {
          paymentId: '650e8400-e29b-41d4-a716-446655440002',
          amount: 5.0,
          currency: 'USD',
          status: 'APPROVED',
          paidAt: '2025-01-01T10:30:00.000Z',
          method: 'credit_card',
          user: {
            name: 'Juan Pérez',
            email: 'juan@example.com',
          },
          period: {
            start: '2025-01-01T00:00:00.000Z',
            end: '2025-02-01T00:00:00.000Z',
          },
          receiptUrl: null,
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Pago no encontrado',
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado',
    }),
  );
}

/**
 * 8️⃣ GET /subscription/can-post - Verificar límite de posts
 */
export function ApiCanPost() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '8️⃣ Verificar si puedo crear un post',
      description:
        'Verifica si el usuario ha alcanzado el límite de publicaciones de su plan actual.',
    }),
    ApiResponse({
      status: 200,
      description: 'Estado del límite de posts',
      schema: {
        example: {
          canPost: true,
          remaining: 7,
          plan: 'BRONCE',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado',
    }),
  );
}
