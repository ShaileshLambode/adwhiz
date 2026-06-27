import { toast } from 'react-toastify';

/**
 * handlePlanGateError
 * ──────────────────────
 * Usage/feature-gate middleware on the backend (usageMiddleware,
 * planFeatureMiddleware) replies with a 403 and one of these `code` values:
 *   - USAGE_LIMIT_REACHED   (monthly post quota hit)
 *   - FEATURE_NOT_AVAILABLE (e.g. Instagram publishing on Free)
 *   - BRAND_LIMIT_REACHED   (extra brand/logo on Free or Basic)
 *
 * Call this from a catch block. It shows a toast with an "Upgrade" action
 * and returns true if it handled a plan-gate error, so the caller can skip
 * showing its own generic error toast. Returns false for anything else,
 * so normal error handling continues as before.
 */
export function handlePlanGateError(err, navigate) {
  const data = err?.response?.data;
  const planGateCodes = ['USAGE_LIMIT_REACHED', 'FEATURE_NOT_AVAILABLE', 'BRAND_LIMIT_REACHED'];

  if (data?.code && planGateCodes.includes(data.code)) {
    toast.error(data.message || "You've hit a plan limit.", {
      autoClose: 6000,
    });
    if (navigate) {
      // Small delay so the person can read the toast before the page changes.
      setTimeout(() => navigate('/pricing'), 1500);
    }
    return true;
  }
  return false;
}
