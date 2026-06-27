const razorpay = require("../utils/razorpay");
const User = require("../models/User");
const { PLANS, getPlan } = require("../config/plans");
const { validatePaymentVerification } = require("razorpay/dist/utils/razorpay-utils");

/**
 * GET /api/subscription/plans
 * Public-ish (still behind userMiddleware so we know who's asking, but
 * doesn't depend on the user's current plan) — returns the plan catalogue
 * for the pricing page so the frontend never hardcodes prices/limits.
 */
exports.listPlans = async (req, res) => {
  const safePlans = Object.values(PLANS).map((p) => ({
    key: p.key,
    name: p.name,
    price: p.price,
    postsPerMonth: p.postsPerMonth === Infinity ? "Unlimited" : p.postsPerMonth,
    watermark: p.watermark,
    instagramPublishing: p.instagramPublishing,
    maxBrands: p.maxBrands === Infinity ? "Unlimited" : p.maxBrands,
    priorityGeneration: p.priorityGeneration,
    reelGenerator: p.reelGenerator,
  }));
  res.json({ success: true, plans: safePlans });
};

/**
 * GET /api/subscription/me
 * Current plan + live usage — powers the "current plan" widget / usage bar.
 */
exports.getMySubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const plan = getPlan(user.plan);

    res.json({
      success: true,
      plan: plan.key,
      planName: plan.name,
      subscriptionStatus: user.subscriptionStatus,
      currentPeriodEnd: user.currentPeriodEnd,
      usage: {
        used: user.monthlyUsage.count,
        limit: plan.postsPerMonth === Infinity ? null : plan.postsPerMonth,
        resetAt: user.monthlyUsage.resetAt,
      },
      features: {
        watermark: plan.watermark,
        instagramPublishing: plan.instagramPublishing,
        maxBrands: plan.maxBrands === Infinity ? null : plan.maxBrands,
        priorityGeneration: plan.priorityGeneration,
        reelGenerator: plan.reelGenerator,
      },
    });
  } catch (error) {
    console.error("[getMySubscription] error:", error);
    res.status(500).json({ success: false, message: "Error fetching subscription" });
  }
};

/**
 * POST /api/subscription/create
 * Body: { planKey: "basic" | "pro" }
 *
 * Creates (or reuses) a Razorpay customer, then creates a Razorpay
 * Subscription in "created" status. Returns the subscription_id for the
 * frontend to hand to Razorpay Checkout — actual activation happens only
 * after the user completes the authorization payment (handled by the
 * webhook, not this route).
 */
exports.createSubscription = async (req, res) => {
  try {
    const { planKey } = req.body;
    const plan = PLANS[planKey];

    if (!plan || plan.key === "free") {
      return res.status(400).json({ success: false, message: "Invalid plan selected" });
    }
    if (!plan.razorpayPlanId) {
      return res.status(500).json({
        success: false,
        message: `Razorpay plan_id for "${plan.key}" is not configured. Set RAZORPAY_PLAN_ID_${plan.key.toUpperCase()} in .env.`,
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Reuse an existing Razorpay customer if we already created one.
    let customerId = user.razorpayCustomerId;
    if (!customerId) {
      const customer = await razorpay.customers.create({
        name: user.name || "AdWhiz User",
        email: user.email,
        fail_existing: 0, // if a customer with this email already exists on Razorpay, reuse it instead of erroring
      });
      customerId = customer.id;
      user.razorpayCustomerId = customerId;
      await user.save();
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: plan.razorpayPlanId,
      customer_notify: 1,
      total_count: 120, // ~10 years of monthly cycles; Razorpay subscriptions auto-renew until cancelled
      notes: {
        userId: user._id.toString(),
        planKey: plan.key,
      },
    });

    // Store the pending subscription id now so the webhook can find this
    // user even though status is still "created" (not yet paid).
    user.razorpaySubscriptionId = subscription.id;
    user.subscriptionStatus = "created";
    await user.save();

    res.json({
      success: true,
      subscriptionId: subscription.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      planName: plan.name,
      amount: plan.price,
    });
  } catch (error) {
    console.error("[createSubscription] error:", error?.error || error.message);
    res.status(500).json({ success: false, message: "Error creating subscription" });
  }
};

/**
 * POST /api/subscription/verify
 * Body: { razorpay_payment_id, razorpay_subscription_id, razorpay_signature }
 *
 * Called by the frontend immediately after Razorpay Checkout's handler
 * fires, purely so the UI can show "success" right away. This does NOT
 * replace the webhook — it's a fast-path confirmation. The webhook
 * (subscription.activated / subscription.charged) remains the source of
 * truth and will set the same fields if this call is ever missed
 * (tab closed, network drop, etc).
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing verification fields" });
    }

    const isValid = validatePaymentVerification(
      { subscription_id: razorpay_subscription_id, payment_id: razorpay_payment_id },
      razorpay_signature,
      process.env.RAZORPAY_KEY_SECRET
    );

    if (!isValid) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    const user = await User.findOne({ razorpaySubscriptionId: razorpay_subscription_id });
    if (!user) {
      return res.status(404).json({ success: false, message: "No matching user for this subscription" });
    }

    // Look up which plan this subscription belongs to, via the notes we
    // set at creation time, so we don't have to trust the client for it.
    const subscription = await razorpay.subscriptions.fetch(razorpay_subscription_id);
    const planKey = subscription.notes?.planKey;
    const plan = PLANS[planKey];

    if (plan) {
      user.plan = plan.key;
    }
    user.subscriptionStatus = "active";
    if (subscription.current_end) {
      user.currentPeriodEnd = new Date(subscription.current_end * 1000);
    }
    await user.save();

    res.json({ success: true, message: "Subscription activated", plan: user.plan });
  } catch (error) {
    console.error("[verifyPayment] error:", error?.error || error.message);
    res.status(500).json({ success: false, message: "Error verifying payment" });
  }
};

/**
 * POST /api/subscription/cancel
 * Cancels at the end of the current billing cycle by default, so the user
 * keeps paid-plan access for time they've already paid for. Pass
 * { immediate: true } to cancel right away instead.
 */
exports.cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.razorpaySubscriptionId) {
      return res.status(400).json({ success: false, message: "No active subscription to cancel" });
    }

    const { immediate = false } = req.body;

    await razorpay.subscriptions.cancel(user.razorpaySubscriptionId, {
      cancel_at_cycle_end: immediate ? 0 : 1,
    });

    if (immediate) {
      user.plan = "free";
      user.subscriptionStatus = "cancelled";
    } else {
      // Plan downgrade to "free" happens via the subscription.cancelled
      // webhook once the current cycle actually ends — until then the
      // user keeps their paid features, which is the expected behaviour
      // for "cancel at period end".
      user.subscriptionStatus = "cancelled";
    }
    await user.save();

    res.json({
      success: true,
      message: immediate
        ? "Subscription cancelled immediately."
        : "Subscription will not renew. You keep access until the current billing period ends.",
    });
  } catch (error) {
    console.error("[cancelSubscription] error:", error?.error || error.message);
    res.status(500).json({ success: false, message: "Error cancelling subscription" });
  }
};
