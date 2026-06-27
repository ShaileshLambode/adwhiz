const User = require("../models/User");
const { getPlan } = require("../config/plans");

/**
 * requireFeature(featureKey)
 * ────────────────────────────
 * Generic gate for boolean plan features defined in server/config/plans.js
 * (e.g. "instagramPublishing", "reelGenerator", "priorityGeneration").
 *
 * Usage: router.post('/publish/instagram', userMiddleware, requireFeature('instagramPublishing'), publishToInstagram)
 *
 * Unlike usageMiddleware (which meters a countable resource), this is a
 * pure on/off check — it does not touch monthlyUsage.
 */
function requireFeature(featureKey) {
  return async function (req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Not authorized" });
      }

      const user = req.userDoc || (await User.findById(userId));
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const plan = req.userPlan || getPlan(user.plan);

      if (!plan[featureKey]) {
        return res.status(403).json({
          success: false,
          code: "FEATURE_NOT_AVAILABLE",
          message: `This feature isn't available on your ${plan.name} plan. Please upgrade to continue.`,
          plan: plan.key,
          feature: featureKey,
        });
      }

      req.userPlan = plan;
      req.userDoc = user;
      next();
    } catch (error) {
      console.error(`[requireFeature:${featureKey}] error:`, error);
      res.status(500).json({ success: false, message: "Error checking plan feature" });
    }
  };
}

module.exports = { requireFeature };
