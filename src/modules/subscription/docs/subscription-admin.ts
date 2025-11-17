// docs/subscription-admin.docs.ts
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

// ============================================
// ESTADÍSTICAS GENERALES
// ============================================
export function ApiGetDashboardStats() {
  return applyDecorators(
    ApiOperation({
      summary: 'Estadísticas generales del dashboard',
      description:
        'Retorna un resumen de ingresos, transacciones y crecimiento del mes actual vs mes anterior.',
    }),
    ApiResponse({
      status: 200,
      description: 'Estadísticas obtenidas exitosamente',
      schema: {
        example: {
          currentMonth: {
            revenue: 125000,
            transactions: 50,
            failedPayments: 3,
          },
          lastMonth: {
            revenue: 100000,
          },
          growth: 25.0,
        },
      },
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
    ApiResponse({ status: 403, description: 'Acceso denegado - Solo admin' }),
  );
}

// ============================================
// INGRESOS POR PERÍODO
// ============================================
export function ApiGetRevenue() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener ingresos por período',
      description:
        'Retorna los ingresos agrupados por día, semana, mes o año en un rango de fechas.',
    }),
    ApiQuery({
      name: 'period',
      required: false,
      enum: ['day', 'week', 'month', 'year'],
      description: 'Período de agrupación (por defecto: month)',
      example: 'month',
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      description:
        'Fecha inicial (formato ISO 8601, por defecto: hace 12 meses)',
      example: '2024-01-01',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      description: 'Fecha final (formato ISO 8601, por defecto: hoy)',
      example: '2025-11-17',
    }),
    ApiResponse({
      status: 200,
      description: 'Ingresos obtenidos exitosamente',
      schema: {
        example: [
          {
            period: '2025-01-01T00:00:00.000Z',
            revenue: 25000,
            transactions: 10,
          },
          {
            period: '2025-02-01T00:00:00.000Z',
            revenue: 30000,
            transactions: 12,
          },
          {
            period: '2025-03-01T00:00:00.000Z',
            revenue: 28000,
            transactions: 11,
          },
        ],
      },
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
    ApiResponse({ status: 403, description: 'Acceso denegado - Solo admin' }),
  );
}

// ============================================
// SUSCRIPCIONES POR PLAN
// ============================================
export function ApiGetSubscriptionsByPlan() {
  return applyDecorators(
    ApiOperation({
      summary: 'Distribución de suscripciones por plan',
      description:
        'Retorna la cantidad de suscripciones activas por cada plan.',
    }),
    ApiResponse({
      status: 200,
      description: 'Distribución obtenida exitosamente',
      schema: {
        example: [
          { plan: 'BRONCE', count: 150 },
          { plan: 'PLATA', count: 75 },
          { plan: 'ORO', count: 25 },
        ],
      },
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
    ApiResponse({ status: 403, description: 'Acceso denegado - Solo admin' }),
  );
}

// ============================================
// CRECIMIENTO DE SUSCRIPCIONES
// ============================================
export function ApiGetSubscriptionGrowth() {
  return applyDecorators(
    ApiOperation({
      summary: 'Crecimiento de suscripciones por mes',
      description:
        'Retorna la cantidad de nuevas suscripciones por mes y por plan.',
    }),
    ApiQuery({
      name: 'months',
      required: false,
      type: Number,
      description: 'Cantidad de meses hacia atrás (por defecto: 12)',
      example: 12,
    }),
    ApiResponse({
      status: 200,
      description: 'Crecimiento obtenido exitosamente',
      schema: {
        example: [
          { month: '2025-01-01T00:00:00.000Z', plan: 'BRONCE', count: 20 },
          { month: '2025-01-01T00:00:00.000Z', plan: 'PLATA', count: 10 },
          { month: '2025-02-01T00:00:00.000Z', plan: 'BRONCE', count: 25 },
          { month: '2025-02-01T00:00:00.000Z', plan: 'PLATA', count: 15 },
        ],
      },
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
    ApiResponse({ status: 403, description: 'Acceso denegado - Solo admin' }),
  );
}

// ============================================
// PAGOS RECIENTES
// ============================================
export function ApiGetRecentPayments() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener pagos recientes',
      description:
        'Retorna una lista paginada de los pagos más recientes de todos los usuarios.',
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
      description: 'Cantidad de registros por página (por defecto: 20)',
      example: 20,
    }),
    ApiResponse({
      status: 200,
      description: 'Pagos obtenidos exitosamente',
      schema: {
        example: {
          data: [
            {
              id: 'abc-123',
              userId: 'user-456',
              amount: 2500,
              status: 'approved',
              createdAt: '2025-11-17T20:00:00.000Z',
              user: {
                name: 'Juan',
                lastName: 'Pérez',
                email: 'juan@example.com',
              },
            },
          ],
          meta: {
            page: 1,
            limit: 20,
            total: 150,
            totalPages: 8,
          },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
    ApiResponse({ status: 403, description: 'Acceso denegado - Solo admin' }),
  );
}

// ============================================
// PAGOS FALLIDOS
// ============================================
export function ApiGetFailedPayments() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener pagos fallidos del mes',
      description:
        'Retorna todos los pagos que fallaron durante el mes actual.',
    }),
    ApiResponse({
      status: 200,
      description: 'Pagos fallidos obtenidos exitosamente',
      schema: {
        example: [
          {
            id: 'abc-123',
            userId: 'user-456',
            amount: 2500,
            status: 'rejected',
            failureReason: 'Fondos insuficientes',
            createdAt: '2025-11-17T20:00:00.000Z',
            user: {
              name: 'Juan',
              lastName: 'Pérez',
              email: 'juan@example.com',
            },
          },
        ],
      },
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
    ApiResponse({ status: 403, description: 'Acceso denegado - Solo admin' }),
  );
}

// ============================================
// PRÓXIMAS RENOVACIONES
// ============================================
export function ApiGetUpcomingRenewals() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener próximas renovaciones',
      description:
        'Retorna las suscripciones que se renovarán en los próximos X días.',
    }),
    ApiQuery({
      name: 'days',
      required: false,
      type: Number,
      description: 'Cantidad de días hacia adelante (por defecto: 7)',
      example: 7,
    }),
    ApiResponse({
      status: 200,
      description: 'Renovaciones obtenidas exitosamente',
      schema: {
        example: [
          {
            id: 'sub-123',
            userId: 'user-456',
            plan: 'PLATA',
            nextBillingDate: '2025-11-20T00:00:00.000Z',
            autoRenew: true,
            user: {
              name: 'Juan',
              lastName: 'Pérez',
              email: 'juan@example.com',
            },
          },
        ],
      },
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
    ApiResponse({ status: 403, description: 'Acceso denegado - Solo admin' }),
  );
}

// ============================================
// TASA DE CANCELACIÓN (CHURN RATE)
// ============================================
export function ApiGetChurnRate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener tasa de cancelación (Churn Rate)',
      description:
        'Retorna el porcentaje de suscripciones canceladas durante el mes actual.',
    }),
    ApiResponse({
      status: 200,
      description: 'Tasa de cancelación obtenida exitosamente',
      schema: {
        example: {
          total: 200,
          cancelled: 10,
          churnRate: 5.0,
        },
      },
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
    ApiResponse({ status: 403, description: 'Acceso denegado - Solo admin' }),
  );
}

// ============================================
// LIFETIME VALUE (LTV)
// ============================================
export function ApiGetLTV() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener Lifetime Value (LTV) promedio',
      description:
        'Retorna el valor promedio total que cada usuario ha gastado y el desglose por usuario.',
    }),
    ApiResponse({
      status: 200,
      description: 'LTV obtenido exitosamente',
      schema: {
        example: {
          averageLTV: 15000.0,
          perUser: [
            { userId: 'user-123', ltv: 25000.0 },
            { userId: 'user-456', ltv: 10000.0 },
            { userId: 'user-789', ltv: 20000.0 },
          ],
        },
      },
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
    ApiResponse({ status: 403, description: 'Acceso denegado - Solo admin' }),
  );
}

// ============================================
// USUARIOS POR PLAN
// ============================================
export function ApiGetUsersByPlan() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener cantidad de usuarios por plan',
      description:
        'Retorna el conteo de usuarios únicos agrupados por tipo de plan.',
    }),
    ApiResponse({
      status: 200,
      description: 'Conteo obtenido exitosamente',
      schema: {
        example: [
          { plan: 'BRONCE', count: 150 },
          { plan: 'PLATA', count: 75 },
          { plan: 'ORO', count: 25 },
        ],
      },
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
    ApiResponse({ status: 403, description: 'Acceso denegado - Solo admin' }),
  );
}
