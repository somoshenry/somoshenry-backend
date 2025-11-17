// Barrel export - Exporta todos los decoradores de Swagger

// ============================================
// MEMBER SUBSCRIPTION ENDPOINTS
// ============================================
export {
  ApiGetMySubscription,
  ApiGetPlans,
  ApiUpgradePlan,
  ApiCancelSubscription,
  ApiReactivateSubscription,
  ApiGetMyPayments,
  ApiGetPaymentReceipt,
  ApiCanPost,
} from './member-subscription.swagger';

// ============================================
// ADMIN DASHBOARD ENDPOINTS
// ============================================
export {
  ApiGetDashboardStats,
  ApiGetRevenue,
  ApiGetSubscriptionsByPlan,
  ApiGetSubscriptionGrowth,
  ApiGetRecentPayments,
  ApiGetFailedPayments,
  ApiGetUpcomingRenewals,
  ApiGetChurnRate,
  ApiGetLTV,
  ApiGetUsersByPlan,
} from './admin-dashboard.swagger';

// ============================================
// WEBHOOK ENDPOINTS
// ============================================
export { ApiMercadoPagoWebhook } from './payments-webhook.swagger';
