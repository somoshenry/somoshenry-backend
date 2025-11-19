// docs/index.ts

// ============================================
// PAYMENT CONTROLLER DOCS
// ============================================
export {
  ApiGetPaymentHistory,
  ApiGetPaymentReceipt,
  ApiGetPaymentStats,
} from './payment.docs';

// ============================================
// SUBSCRIPTION CONTROLLER DOCS
// ============================================
export {
  ApiGetPlans,
  ApiGetUserPlan,
  ApiGetCurrentSubscription,
  ApiCanPost,
  ApiCancelSubscription,
  ApiReactivateSubscription,
} from './subscription.docs';

// ============================================
// SUBSCRIPTION ADMIN CONTROLLER DOCS
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
} from './subscription-admin';
