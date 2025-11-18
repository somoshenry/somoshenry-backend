// docs/payment.docs.ts
import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

// ============================================
// HISTORIAL DE PAGOS
// ============================================
export function ApiGetPaymentHistory() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener historial de pagos del usuario',
      description:
        'Retorna el historial paginado de todos los pagos realizados por el usuario autenticado.',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Número de página (por defecto: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Cantidad de registros por página (por defecto: 10)',
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: 'Historial de pagos obtenido exitosamente',
      schema: {
        example: {
          data: [
            {
              id: 'abc-123',
              amount: 2500,
              currency: 'ARS',
              status: 'approved',
              mercadoPagoId: '123456789',
              paymentMethod: 'credit_card',
              paidAt: '2025-11-17T20:00:00.000Z',
              createdAt: '2025-11-17T19:55:00.000Z',
            },
          ],
          meta: {
            page: 1,
            limit: 10,
            total: 25,
            totalPages: 3,
          },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );
}

// ============================================
// RECIBO DE PAGO
// ============================================
export function ApiGetPaymentReceipt() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener recibo de un pago específico',
      description:
        'Retorna los detalles completos de un pago incluyendo información del usuario y período cubierto.',
    }),
    ApiParam({
      name: 'paymentId',
      type: String,
      description: 'ID del pago',
      example: 'e1bacfdd-12c2-4b70-8b3a-81427bede634',
    }),
    ApiResponse({
      status: 200,
      description: 'Recibo obtenido exitosamente',
      schema: {
        example: {
          paymentId: 'e1bacfdd-12c2-4b70-8b3a-81427bede634',
          amount: 2500,
          currency: 'ARS',
          status: 'approved',
          paidAt: '2025-11-17T20:00:00.000Z',
          method: 'credit_card',
          user: {
            name: 'Juan Pérez',
            email: 'juan@example.com',
          },
          period: {
            start: '2025-11-17T20:00:00.000Z',
            end: '2025-12-17T20:00:00.000Z',
          },
          receiptUrl: null,
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Pago no encontrado' }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );
}

// ============================================
// ESTADÍSTICAS DE PAGOS
// ============================================
export function ApiGetPaymentStats() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener estadísticas de pagos del usuario',
      description:
        'Retorna un resumen estadístico de todos los pagos del usuario: totales, montos, promedios, etc.',
    }),
    ApiResponse({
      status: 200,
      description: 'Estadísticas obtenidas exitosamente',
      schema: {
        example: {
          total: 15,
          approved: 12,
          failed: 2,
          pending: 1,
          cancelled: 0,
          refunded: 0,
          totalSpent: 30000.0,
          totalRefunded: 0.0,
          averagePayment: 2500.0,
          lastPayment: {
            id: 'abc-123',
            amount: 2500,
            status: 'approved',
            method: 'credit_card',
            date: '2025-11-17T20:00:00.000Z',
          },
          paymentMethods: [
            { method: 'credit_card', count: 10 },
            { method: 'debit_card', count: 2 },
          ],
          monthlyStats: {
            payments: 3,
            spent: 7500.0,
          },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );
}
