const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  confirmPassword: String,

  // ─── Subscription / Billing ───────────────────────────────────────────
  plan: {
    type: String,
    enum: ["free", "basic", "pro"],
    default: "free",
  },
  razorpayCustomerId: {
    type: String,
    default: null,
  },
  razorpaySubscriptionId: {
    type: String,
    default: null,
  },
  subscriptionStatus: {
    // Mirrors Razorpay subscription statuses we care about, plus "none"
    // for users who have never subscribed.
    type: String,
    enum: ["none", "created", "active", "past_due", "cancelled", "expired"],
    default: "none",
  },
  currentPeriodEnd: {
    // When the current paid billing cycle ends. Used to know when the
    // plan should revert to "free" after a cancellation takes effect.
    type: Date,
    default: null,
  },

  // ─── Usage metering (resets monthly, enforced by usageMiddleware) ─────
  monthlyUsage: {
    count: { type: Number, default: 0 },
    resetAt: { type: Date, default: () => addOneMonth(new Date()) },
  },
}, { timestamps: true });

function addOneMonth(date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  return d;
}

module.exports = mongoose.model("User", userSchema);
