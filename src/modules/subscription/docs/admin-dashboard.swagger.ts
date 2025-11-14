import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

/**
 * 📊 GET /admin/dashboard/stats - Estadísticas generales
 */
export function ApiGetDashboardStats() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '📊 Estadísticas generales del negocio',
      description:
        'Retorna métricas clave del dashboard administrativo: ingresos del mes actual y anterior, número de transacciones, pagos fallidos y tasa de crecimiento porcentual.',
    }),
    ApiResponse({
      status: 200,
      description: 'Estadísticas obtenidas exitosamente',
      schema: {
        type: 'object',
        properties: {
          currentMonth: {
            type: 'object',
            properties: {
              revenue: {
                type: 'number',
                example: 1250.5,
                description: 'Ingresos totales del mes actual',
              },
              transactions: {
                type: 'number',
                example: 42,
                description: 'Número de transacciones aprobadas',
              },
              failedPayments: {
                type: 'number',
                example: 3,
                description: 'Número de pagos fallidos',
              },
            },
          },
          lastMonth: {
            type: 'object',
            properties: {
              revenue: {
                type: 'number',
                example: 980.0,
                description: 'Ingresos totales del mes anterior',
              },
            },
          },
          growth: {
            type: 'number',
            example: 27.6,
            description: 'Porcentaje de crecimiento respecto al mes anterior',
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Acceso denegado - Solo administradores pueden acceder',
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado - Token inválido o expirado',
    }),
  );
}

/**
 * 💰 GET /admin/dashboard/revenue - Ingresos por período
 */
export function ApiGetRevenue() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '💰 Ingresos por período',
      description:
        'Obtiene los ingresos totales agrupados por día, semana, mes o año dentro de un rango de fechas específico.',
    }),
    ApiQuery({
      name: 'period',
      required: false,
      enum: ['day', 'week', 'month', 'year'],
      example: 'month',
      description: 'Período de agrupación de los datos',
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      example: '2025-01-01',
      description: 'Fecha de inicio del rango (formato: YYYY-MM-DD)',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      example: '2025-12-31',
      description: 'Fecha de fin del rango (formato: YYYY-MM-DD)',
    }),
    ApiResponse({
      status: 200,
      description: 'Ingresos por período obtenidos exitosamente',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T00:00:00.000Z',
              description: 'Inicio del período',
            },
            revenue: {
              type: 'number',
              example: 150.0,
              description: 'Ingresos totales en el período',
            },
            transactions: {
              type: 'number',
              example: 8,
              description: 'Número de transacciones en el período',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Acceso denegado',
    }),
  );
}

/**
 * 📈 GET /admin/dashboard/subscriptions/by-plan - Distribución por plan
 */
export function ApiGetSubscriptionsByPlan() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '📈 Distribución de suscripciones por plan',
      description:
        'Retorna la cantidad de usuarios activos en cada plan de suscripción (BRONCE, PLATA, ORO).',
    }),
    ApiResponse({
      status: 200,
      description: 'Distribución obtenida exitosamente',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            plan: {
              type: 'string',
              enum: ['BRONCE', 'PLATA', 'ORO'],
              example: 'BRONCE',
            },
            count: {
              type: 'number',
              example: 125,
              description: 'Número de usuarios en este plan',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Acceso denegado',
    }),
  );
}

/**
 * 📅 GET /admin/dashboard/subscriptions/growth - Crecimiento
 */
export function ApiGetSubscriptionGrowth() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '📅 Crecimiento de suscripciones',
      description:
        'Muestra el crecimiento de suscripciones desglosado por plan en los últimos N meses.',
    }),
    ApiQuery({
      name: 'months',
      required: false,
      type: Number,
      example: 12,
      description: 'Número de meses hacia atrás a consultar',
    }),
    ApiResponse({
      status: 200,
      description: 'Crecimiento obtenido exitosamente',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            month: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T00:00:00.000Z',
            },
            plan: {
              type: 'string',
              enum: ['BRONCE', 'PLATA', 'ORO'],
              example: 'PLATA',
            },
            count: {
              type: 'number',
              example: 8,
              description: 'Nuevas suscripciones en ese mes',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Acceso denegado',
    }),
  );
}

/**
 * 💳 GET /admin/dashboard/payments/recent - Pagos recientes
 */
export function ApiGetRecentPayments() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '💳 Pagos recientes',
      description:
        'Lista los últimos pagos realizados en la plataforma con información del usuario.',
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
      example: 20,
      description: 'Resultados por página',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de pagos recientes obtenida',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'payment-uuid' },
                amount: { type: 'number', example: 5.0 },
                currency: { type: 'string', example: 'USD' },
                status: {
                  type: 'string',
                  enum: [
                    'PENDING',
                    'APPROVED',
                    'FAILED',
                    'CANCELLED',
                    'REFUNDED',
                  ],
                  example: 'APPROVED',
                },
                paidAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-01-15T14:30:00.000Z',
                },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'user-uuid' },
                    name: { type: 'string', example: 'Juan' },
                    lastName: { type: 'string', example: 'Pérez' },
                    email: { type: 'string', example: 'juan@example.com' },
                  },
                },
              },
            },
          },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 20 },
              total: { type: 'number', example: 156 },
              totalPages: { type: 'number', example: 8 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Acceso denegado',
    }),
  );
}

/**
 * ❌ GET /admin/dashboard/payments/failed - Pagos fallidos
 */
export function ApiGetFailedPayments() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '❌ Pagos fallidos',
      description:
        'Lista todos los pagos que han fallado en el mes actual para seguimiento y análisis.',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de pagos fallidos obtenida',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'payment-uuid' },
            amount: { type: 'number', example: 10.0 },
            currency: { type: 'string', example: 'USD' },
            status: { type: 'string', example: 'FAILED' },
            failureReason: {
              type: 'string',
              example: 'Tarjeta rechazada',
              description: 'Motivo del fallo',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-10T09:00:00.000Z',
            },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'user-uuid' },
                name: { type: 'string', example: 'María' },
                lastName: { type: 'string', example: 'García' },
                email: { type: 'string', example: 'maria@example.com' },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Acceso denegado',
    }),
  );
}

/**
 * 🔄 GET /admin/dashboard/subscriptions/upcoming-renewals
 */
export function ApiGetUpcomingRenewals() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '🔄 Próximas renovaciones',
      description:
        'Lista las suscripciones que se renovarán automáticamente en los próximos N días.',
    }),
    ApiQuery({
      name: 'days',
      required: false,
      type: Number,
      example: 7,
      description: 'Días hacia adelante a consultar',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de próximas renovaciones',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'subscription-uuid' },
            userId: { type: 'string', example: 'user-uuid' },
            plan: {
              type: 'string',
              enum: ['BRONCE', 'PLATA', 'ORO'],
              example: 'PLATA',
            },
            nextBillingDate: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-20T00:00:00.000Z',
            },
            autoRenew: { type: 'boolean', example: true },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'user-uuid' },
                name: { type: 'string', example: 'Carlos' },
                email: { type: 'string', example: 'carlos@example.com' },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Acceso denegado',
    }),
  );
}

/**
 * 📉 GET /admin/dashboard/subscriptions/churn-rate
 */
export function ApiGetChurnRate() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '📉 Tasa de cancelación mensual',
      description:
        'Calcula el churn rate (tasa de cancelación) del mes actual: (cancelaciones / total) * 100',
    }),
    ApiResponse({
      status: 200,
      description: 'Churn rate calculado exitosamente',
      schema: {
        type: 'object',
        properties: {
          total: {
            type: 'number',
            example: 188,
            description: 'Total de suscripciones al inicio del mes',
          },
          cancelled: {
            type: 'number',
            example: 12,
            description: 'Suscripciones canceladas en el mes',
          },
          churnRate: {
            type: 'number',
            example: 6.38,
            description: 'Porcentaje de cancelación',
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Acceso denegado',
    }),
  );
}

/**
 * 💎 GET /admin/dashboard/subscriptions/ltv
 */
export function ApiGetLTV() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '💎 Lifetime Value promedio de clientes',
      description:
        'Calcula el valor promedio de vida del cliente (LTV) basado en todos los pagos históricos.',
    }),
    ApiResponse({
      status: 200,
      description: 'LTV calculado exitosamente',
      schema: {
        type: 'object',
        properties: {
          averageLTV: {
            type: 'number',
            example: 45.5,
            description: 'Valor promedio por cliente',
          },
          totalCustomers: {
            type: 'number',
            example: 188,
            description: 'Total de clientes',
          },
          totalRevenue: {
            type: 'number',
            example: 8554.0,
            description: 'Ingresos totales acumulados',
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Acceso denegado',
    }),
  );
}

/**
 * 👥 GET /admin/dashboard/users/by-plan
 */
export function ApiGetUsersByPlan() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '👥 Usuarios distribuidos por plan',
      description:
        'Retorna la distribución de usuarios por plan con porcentajes calculados.',
    }),
    ApiResponse({
      status: 200,
      description: 'Distribución de usuarios obtenida',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            plan: {
              type: 'string',
              enum: ['BRONCE', 'PLATA', 'ORO'],
              example: 'BRONCE',
            },
            users: {
              type: 'number',
              example: 125,
              description: 'Número de usuarios',
            },
            percentage: {
              type: 'number',
              example: 66.5,
              description: 'Porcentaje del total',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Acceso denegado',
    }),
  );
}
