const User = require("../models/User");
const { getPlan } = require("../config/plans");

/**
 * checkUsageLimit
 * ────────────────
 * Sits in front of any AI-generation route (/generate on promo, quote,
 * offer). Responsibilities:
 *
 *   1. Reset monthlyUsage.count to 0 if the reset window has passed.
 *   2. Reject the request with 403 if the user's plan limit is exhausted.
 *   3. Attach req.userPlan (the resolved plan config) so downstream
 *      controllers can make plan-aware decisions (e.g. watermarking)
 *      without re-querying Mongo.
 *
 * NOTE: This middleware does NOT increment usage. Incrementing happens
 * only after a generation actually succeeds (see incrementUsage below),
 * so a failed AI call never costs the user one of their quota slots.
 */
async function checkUsageLimit(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Reset the monthly counter if we've crossed into a new billing window.
    const now = new Date();
    if (!user.monthlyUsage?.resetAt || now >= user.monthlyUsage.resetAt) {
      user.monthlyUsage.count = 0;
      const nextReset = new Date(now);
      nextReset.setMonth(nextReset.getMonth() + 1);
      user.monthlyUsage.resetAt = nextReset;
      await user.save();
    }

    const plan = getPlan(user.plan);

    if (user.monthlyUsage.count >= plan.postsPerMonth) {
      return res.status(403).json({
        success: false,
        code: "USAGE_LIMIT_REACHED",
        message: `You've used all ${plan.postsPerMonth} posts included in the ${plan.name} plan this month. Upgrade to continue generating.`,
        plan: plan.key,
        limit: plan.postsPerMonth,
        used: user.monthlyUsage.count,
        resetAt: user.monthlyUsage.resetAt,
      });
    }

    // Make plan + the live user doc available downstream without another query.
    req.userPlan = plan;
    req.userDoc = user;
    next();
  } catch (error) {
    console.error("[usageMiddleware] error:", error);
    res.status(500).json({ success: false, message: "Error checking usage limit" });
  }
}

/**
 * incrementUsage
 * ────────────────
 * Call this ONLY after a generation has succeeded. Pass the userId
 * (or reuse req.userDoc._id if checkUsageLimit already ran in the chain).
 */
async function incrementUsage(userId) {
  await User.findByIdAndUpdate(userId, { $inc: { "monthlyUsage.count": 1 } });
}

module.exports = { checkUsageLimit, incrementUsage };
