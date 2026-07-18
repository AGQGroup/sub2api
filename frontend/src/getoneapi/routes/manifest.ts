/**
 * GetOneAPI route ownership manifest.
 *
 * Classifies every public and regular-user page into a rollout phase.
 * This is the rollout/test inventory only — authorization guards
 * (`requiresAuth`, `requiresAdmin`, `requiresPayment`, backend-mode logic)
 * remain unchanged and must never branch on this classification.
 *
 * - core-5: home, auth (login/register/recovery/callbacks), dashboard, keys
 * - beta-50: every other user-visible page
 */
export type SurfacePhase = 'core-5' | 'beta-50'

export const getoneapiRouteManifest: Readonly<Record<string, SurfacePhase>> = {
  '/home': 'core-5',
  '/login': 'core-5',
  '/register': 'core-5',
  '/email-verify': 'core-5',
  '/forgot-password': 'core-5',
  '/reset-password': 'core-5',
  '/auth/callback': 'core-5',
  '/auth/linuxdo/callback': 'core-5',
  '/auth/wechat/callback': 'core-5',
  '/auth/dingtalk/callback': 'core-5',
  '/auth/dingtalk/email-completion': 'core-5',
  '/auth/oidc/callback': 'core-5',
  '/dashboard': 'core-5',
  '/keys': 'core-5',
  '/key-usage': 'beta-50',
  '/legal/:documentId': 'beta-50',
  '/auth/wechat/payment/callback': 'beta-50',
  '/batch-image': 'beta-50',
  '/usage': 'beta-50',
  '/redeem': 'beta-50',
  '/affiliate': 'beta-50',
  '/available-channels': 'beta-50',
  '/profile': 'beta-50',
  '/subscriptions': 'beta-50',
  '/purchase': 'beta-50',
  '/orders': 'beta-50',
  '/payment/qrcode': 'beta-50',
  '/payment/result': 'beta-50',
  '/payment/stripe': 'beta-50',
  '/payment/airwallex': 'beta-50',
  '/payment/stripe-popup': 'beta-50',
  '/custom/:id': 'beta-50',
  '/monitor': 'beta-50',
  '/:pathMatch(.*)*': 'beta-50'
}
