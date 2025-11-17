// docs/subscription.docs.ts
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

// ============================================
// VER PLANES DISPONIBLES
// ============================================
export function ApiGetPlans() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener planes de suscripción disponibles',
      description:
        'Retorna todos los planes de suscripción disponibles con sus características y precios.',
    }),
    ApiResponse({
      status: 200,
      description: 'Planes obtenidos exitosamente',
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
  );
}

// ============================================
// PLAN ACTUAL DEL USUARIO
// ============================================
export function ApiGetUserPlan() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener plan actual del usuario',
      description:
        'Retorna el tipo de plan de suscripción que tiene actualmente el usuario (BRONCE, PLATA, ORO).',
    }),
    ApiResponse({
      status: 200,
      description: 'Plan obtenido exitosamente',
      schema: {
        example: 'PLATA',
      },
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );
}

// ============================================
// SUSCRIPCIÓN ACTUAL
// ============================================
export function ApiGetCurrentSubscription() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener suscripción actual del usuario',
      description:
        'Retorna todos los detalles de la suscripción activa del usuario.',
    }),
    ApiResponse({
      status: 200,
      description: 'Suscripción obtenida exitosamente',
      schema: {
        example: {
          id: '75398750-ac97-4a5c-a915-316fc73c2d64',
          userId: '5de46tcf-dc49-4af2-afd2-8d310e1d0bfb',
          plan: 'PLATA',
          status: 'ACTIVE',
          startDate: '2025-11-17T03:47:19.975Z',
          endDate: '2025-12-17T03:47:19.975Z',
          nextBillingDate: '2025-12-17T03:47:19.975Z',
          autoRenew: true,
          cancelledAt: null,
          cancellationReason: null,
          createdAt: '2025-11-15T21:50:58.957Z',
          updatedAt: '2025-11-17T16:41:20.970Z',
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Suscripción no encontrada' }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );
}

// ============================================
// VERIFICAR SI PUEDE PUBLICAR
// ============================================
export function ApiCanPost() {
  return applyDecorators(
    ApiOperation({
      summary: 'Verificar si el usuario puede publicar',
      description:
        'Verifica si el usuario puede crear un nuevo post según su plan y límites mensuales.',
    }),
    ApiResponse({
      status: 200,
      description: 'Verificación exitosa',
      schema: {
        example: {
          canPost: true,
          remaining: 35,
          plan: 'PLATA',
        },
      },
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );
}

// ============================================
// CANCELAR SUSCRIPCIÓN
// ============================================
export function ApiCancelSubscription() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cancelar suscripción',
      description:
        'Cancela la suscripción del usuario. El acceso continuará hasta el fin del período pagado.',
    }),
    ApiResponse({
      status: 200,
      description: 'Suscripción cancelada exitosamente',
      schema: {
        example: {
          message:
            'Suscripción cancelada. Seguirás teniendo acceso hasta el fin del período.',
          endsAt: '2025-12-17T03:47:19.975Z',
          status: 'CANCELLED',
          cancelledAt: '2025-11-17T16:41:20.970Z',
          cancellationReason: 'Ya no lo necesito',
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Suscripción no encontrada' }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );
}

// ============================================
// REACTIVAR SUSCRIPCIÓN
// ============================================
export function ApiReactivateSubscription() {
  return applyDecorators(
    ApiOperation({
      summary: 'Reactivar suscripción cancelada',
      description: 'Reactiva una suscripción que fue cancelada anteriormente.',
    }),
    ApiResponse({
      status: 200,
      description: 'Suscripción reactivada exitosamente',
      schema: {
        example: {
          message: 'Suscripción reactivada',
          status: 'ACTIVE',
          nextBillingDate: '2025-12-17T03:47:19.975Z',
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Suscripción no encontrada' }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );
}
