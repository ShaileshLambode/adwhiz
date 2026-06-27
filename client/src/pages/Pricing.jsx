import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaCheck, FaTimes } from 'react-icons/fa';
import useSubscription from '../hooks/useSubscription';

const PLAN_DISPLAY = [
  {
    key: 'free',
    name: 'Free',
    price: 0,
    tagline: 'Try AdWhiz out',
    features: [
      { label: '5 posts / month', included: true },
      { label: 'Watermarked output', included: true, negative: true },
      { label: 'Instagram publishing', included: false },
      { label: 'All templates', included: false },
    ],
  },
  {
    key: 'basic',
    name: 'Basic',
    price: 199,
    tagline: 'For getting consistent with content',
    highlight: true,
    features: [
      { label: '100 posts / month', included: true },
      { label: 'No watermark', included: true },
      { label: 'Instagram publishing', included: true },
      { label: 'All templates', included: true },
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 499,
    tagline: 'For agencies & power users',
    features: [
      { label: 'Unlimited posts', included: true },
      { label: 'Priority generation', included: true },
      { label: 'Reel Generator (coming soon)', included: true },
      { label: 'Multiple brands', included: true },
    ],
  },
];

export default function Pricing() {
  const [processingPlan, setProcessingPlan] = useState(null);
  const navigate = useNavigate();
  const { subscription, refresh } = useSubscription();
  const API = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const currentPlan = subscription?.plan || 'free';

  const handleChoosePlan = async (planKey) => {
    if (planKey === 'free') {
      navigate('/settings/billing');
      return;
    }
    if (planKey === currentPlan) {
      toast.info("You're already on this plan.");
      return;
    }

    setProcessingPlan(planKey);
    try {
      const { data } = await axios.post(
        `${API}/api/subscription/create`,
        { planKey },
        { headers }
      );

      if (!data.success) {
        toast.error(data.message || 'Could not start checkout.');
        setProcessingPlan(null);
        return;
      }

      // Razorpay Checkout.js is loaded globally via index.html
      const options = {
        key: data.razorpayKeyId,
        subscription_id: data.subscriptionId,
        name: 'AdWhiz',
        description: `${data.planName} Plan Subscription`,
        theme: { color: '#FF6666' },
        handler: async function (response) {
          try {
            const verifyRes = await axios.post(
              `${API}/api/subscription/verify`,
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers }
            );
            if (verifyRes.data.success) {
              toast.success(`You're now on the ${data.planName} plan!`);
              await refresh();
              navigate('/settings/billing');
            } else {
              toast.error('Payment verification failed. If you were charged, contact support.');
            }
          } catch (err) {
            console.error(err);
            toast.error('Payment verification failed. If you were charged, contact support.');
          }
        },
        modal: {
          ondismiss: function () {
            setProcessingPlan(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Could not start checkout.');
    } finally {
      setProcessingPlan(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-gray-900 font-outfit">Choose your plan</h2>
        <p className="text-gray-500 mt-2">Upgrade any time. Cancel any time — you keep access until the period ends.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLAN_DISPLAY.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          return (
            <div
              key={plan.key}
              className={`relative rounded-3xl border p-8 flex flex-col bg-white transition-all duration-300 ${
                plan.highlight
                  ? 'border-[#FF6666] shadow-xl scale-[1.02]'
                  : 'border-gray-100 shadow-md'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6666] text-white text-xs font-bold px-4 py-1 rounded-full shadow-md">
                  MOST POPULAR
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900 font-outfit">{plan.name}</h3>
              <p className="text-sm text-gray-500 mt-1 mb-6">{plan.tagline}</p>

              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900">₹{plan.price}</span>
                {plan.price > 0 && <span className="text-gray-500 text-sm">/month</span>}
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    {f.included ? (
                      <FaCheck className={`mt-0.5 ${f.negative ? 'text-amber-500' : 'text-green-500'}`} />
                    ) : (
                      <FaTimes className="mt-0.5 text-gray-300" />
                    )}
                    <span className={f.included ? '' : 'text-gray-400'}>{f.label}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleChoosePlan(plan.key)}
                disabled={isCurrent || processingPlan === plan.key}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer disabled:cursor-not-allowed ${
                  isCurrent
                    ? 'bg-gray-100 text-gray-400'
                    : plan.highlight
                    ? 'bg-gradient-to-r from-[#F8AD9D] to-[#FF6666] text-white shadow-lg hover:shadow-xl'
                    : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {isCurrent
                  ? 'Current Plan'
                  : processingPlan === plan.key
                  ? 'Opening checkout...'
                  : plan.price === 0
                  ? 'Switch to Free'
                  : `Upgrade to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-400 mt-8">
        Prices in INR. Payments processed securely by Razorpay (UPI, cards, netbanking supported).
      </p>
    </div>
  );
}
