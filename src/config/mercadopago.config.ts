import { registerAs } from '@nestjs/config';

export default registerAs('mercadopago', () => ({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY,

  // URLs de notificación (webhooks)
  webhookUrl: process.env.BACKEND_URL + '/mercadopago/webhook',
  // webhookUrl: process.env.BACKEND_URL + '/payments/webhook',

  // URLs de redirección
  successUrl: process.env.FRONTEND_URL + '/redirect/success',
  failureUrl: process.env.FRONTEND_URL + '/redirect/failure',
  pendingUrl: process.env.FRONTEND_URL + '/redirect/pending',
  // successUrl: process.env.FRONTEND_URL + '/subscription/success',
  // failureUrl: process.env.FRONTEND_URL + '/subscription/failure',
  // pendingUrl: process.env.FRONTEND_URL + '/subscription/pending',

  // Planes de suscripción
  plans: {
    BRONCE: {
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
    PLATA: {
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
    ORO: {
      name: 'Nivel 2',
      price: 10,
      currency: 'USD',
      maxPostsPerMonth: -1, // Ilimitado
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
  },
}));
