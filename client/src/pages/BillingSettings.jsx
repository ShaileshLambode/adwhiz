import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaCrown, FaExclamationTriangle } from 'react-icons/fa';
import useSubscription from '../hooks/useSubscription';

const PLAN_LABELS = { free: 'Free', basic: 'Basic', pro: 'Pro' };

export default function BillingSettings() {
  const { subscription, loading, refresh } = useSubscription();
  const [cancelling, setCancelling] = useState(false);
  const API = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? You will keep access until the end of your current billing period, then move to the Free plan.')) {
      return;
    }
    setCancelling(true);
    try {
      const { data } = await axios.post(`${API}/api/subscription/cancel`, {}, { headers });
      toast.info(data.message || 'Subscription cancelled.');
      await refresh();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to cancel subscription.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6666]"></div>
      </div>
    );
  }

  const plan = subscription?.plan || 'free';
  const usage = subscription?.usage || { used: 0, limit: 5 };
  const usagePercent = usage.limit ? Math.min(100, (usage.used / usage.limit) * 100) : 0;
  const isUnlimited = usage.limit === null;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-[#F8AD9D] to-[#FF6666] p-8 text-white">
          <div className="flex items-center gap-3">
            <FaCrown size={24} />
            <h2 className="text-3xl font-extrabold font-outfit">Billing &amp; Plan</h2>
          </div>
          <p className="text-white/80 max-w-xl text-sm leading-relaxed mt-2">
            Manage your AdWhiz subscription and track your monthly usage.
          </p>
        </div>

        <div className="p-8 space-y-8">
          {/* Current plan card */}
          <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50/50">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Current Plan</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{PLAN_LABELS[plan]}</p>
                {subscription?.subscriptionStatus === 'cancelled' && plan !== 'free' && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <FaExclamationTriangle /> Renewal cancelled — access ends{' '}
                    {subscription.currentPeriodEnd
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                      : 'at period end'}
                  </p>
                )}
              </div>
              <Link
                to="/pricing"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F8AD9D] to-[#FF6666] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                {plan === 'free' ? 'Upgrade Plan' : 'Change Plan'}
              </Link>
            </div>
          </div>

          {/* Usage bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">Monthly post usage</p>
              <p className="text-sm text-gray-500">
                {usage.used} {isUnlimited ? '' : `/ ${usage.limit}`} {isUnlimited && '(Unlimited)'}
              </p>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  usagePercent > 90 ? 'bg-red-400' : usagePercent > 70 ? 'bg-amber-400' : 'bg-[#FF6666]'
                }`}
                style={{ width: isUnlimited ? '8%' : `${usagePercent}%` }}
              ></div>
            </div>
            {usage.resetAt && (
              <p className="text-xs text-gray-400 mt-2">
                Resets on {new Date(usage.resetAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Cancel option */}
          {plan !== 'free' && subscription?.subscriptionStatus === 'active' && (
            <div className="border-t border-gray-100 pt-6">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="text-sm text-red-500 hover:text-red-600 font-semibold underline disabled:opacity-50 cursor-pointer"
              >
                {cancelling ? 'Cancelling...' : 'Cancel subscription'}
              </button>
              <p className="text-xs text-gray-400 mt-1">
                You'll keep {PLAN_LABELS[plan]} access until your current billing period ends.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
