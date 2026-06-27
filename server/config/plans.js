// ──────────────────────────────────────────────────────────────────────────
// Subscription plan definitions — single source of truth.
//
// IMPORTANT: razorpayPlanId values are placeholders. Real plan IDs are
// generated once (manually, or via scripts/createRazorpayPlans.js) inside
// your Razorpay Dashboard / API, then pasted here. Razorpay plans are
// immutable once created — if you ever change a price, create a NEW plan
// here with a new key rather than mutating BASIC/PRO in place, so existing
// subscribers keep billing at the price they signed up for.
// ──────────────────────────────────────────────────────────────────────────

const PLANS = {
  free: {
    key: "free",
    name: "Free",
    price: 0, // in INR
    razorpayPlanId: null, // free plan never touches Razorpay
    postsPerMonth: 5,
    watermark: true,
    instagramPublishing: false,
    maxBrands: 1,
    priorityGeneration: false,
    reelGenerator: false,
  },
  basic: {
    key: "basic",
    name: "Basic",
    price: 199,
    razorpayPlanId: process.env.RAZORPAY_PLAN_ID_BASIC || null,
    postsPerMonth: 100,
    watermark: false,
    instagramPublishing: true,
    maxBrands: 1,
    priorityGeneration: false,
    reelGenerator: false,
  },
  pro: {
    key: "pro",
    name: "Pro",
    price: 499,
    razorpayPlanId: process.env.RAZORPAY_PLAN_ID_PRO || null,
    postsPerMonth: Infinity,
    watermark: false,
    instagramPublishing: true,
    maxBrands: Infinity,
    priorityGeneration: true,
    reelGenerator: true, // gate ready for when the Reel Generator ships
  },
};

// Helper so callers never have to null-check a typo'd plan key.
function getPlan(planKey) {
  return PLANS[planKey] || PLANS.free;
}

// Map a Razorpay plan_id back to our internal plan key — used by the
// webhook handler, which only knows the Razorpay-side plan_id.
function getPlanByRazorpayId(razorpayPlanId) {
  if (!razorpayPlanId) return null;
  return (
    Object.values(PLANS).find((p) => p.razorpayPlanId === razorpayPlanId) ||
    null
  );
}

module.exports = { PLANS, getPlan, getPlanByRazorpayId };
