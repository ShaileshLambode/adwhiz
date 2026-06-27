const { validateWebhookSignature } = require("razorpay/dist/utils/razorpay-utils");
const User = require("../models/User");
const { PLANS } = require("../config/plans");

// In-memory de-dupe for webhook retries within a single process lifetime.
// Razorpay retries undelivered webhooks with exponential backoff, and the
// same event can legitimately arrive more than once — x-razorpay-event-id
// is unique per event, so we use it to avoid double-processing (e.g.
// double-incrementing a billing period). For a multi-instance deployment,
// swap this for a small "processedWebhookEvents" Mongo collection instead.
const processedEventIds = new Set();

/**
 * POST /api/webhooks/razorpay
 *
 * IMPORTANT: this route MUST be mounted with express.raw() BEFORE the
 * global express.json() middleware in server.js — Razorpay's signature is
 * computed over the raw request body, and re-serializing a parsed JSON
 * object does not reliably reproduce byte-for-byte the same string,
 * which silently breaks verification.
 */
exports.handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.body; // Buffer, because this route uses express.raw()

    if (!signature) {
      console.warn("[razorpay webhook] missing x-razorpay-signature header — rejecting");
      return res.status(400).json({ success: false, message: "Missing signature header" });
    }

    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.error("[razorpay webhook] RAZORPAY_WEBHOOK_SECRET is not configured");
      return res.status(500).json({ success: false, message: "Webhook secret not configured" });
    }

    const isValid = validateWebhookSignature(
      rawBody.toString(),
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isValid) {
      console.warn("[razorpay webhook] invalid signature — rejecting");
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const event = JSON.parse(rawBody.toString());
    const eventId = req.headers["x-razorpay-event-id"];

    if (eventId && processedEventIds.has(eventId)) {
      // Already handled this exact event — ack with 200 so Razorpay stops retrying.
      return res.status(200).json({ success: true, message: "Duplicate event ignored" });
    }

    await routeEvent(event);

    if (eventId) {
      processedEventIds.add(eventId);
      // Basic memory hygiene for a long-running process.
      if (processedEventIds.size > 5000) {
        const oldest = processedEventIds.values().next().value;
        processedEventIds.delete(oldest);
      }
    }

    // Always 200 on successful processing — Razorpay treats non-2xx as
    // "endpoint failing" and will keep retrying for up to 24 hours.
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("[razorpay webhook] handler error:", error);
    // Returning 500 here is intentional: if we genuinely failed to
    // process (e.g. DB was down), we WANT Razorpay to retry later.
    res.status(500).json({ success: false });
  }
};

async function routeEvent(event) {
  const { event: eventType, payload } = event;

  switch (eventType) {
    case "subscription.activated":
    case "subscription.charged":
      await onSubscriptionActiveOrRenewed(payload.subscription.entity);
      break;

    case "subscription.pending":
    case "subscription.halted":
      await onSubscriptionPastDue(payload.subscription.entity);
      break;

    case "subscription.cancelled":
    case "subscription.completed":
    case "subscription.expired":
      await onSubscriptionEnded(payload.subscription.entity);
      break;

    default:
      // Plenty of other events exist (payment.failed, invoice.*, etc).
      // Nothing else is wired to a feature yet, so just no-op.
      console.log(`[razorpay webhook] unhandled event type: ${eventType}`);
  }
}

async function findUserForSubscription(subscriptionEntity) {
  // Prefer the userId we stamped into notes at creation time; fall back
  // to the subscription_id link stored on the User doc.
  const userId = subscriptionEntity.notes?.userId;
  if (userId) {
    const user = await User.findById(userId);
    if (user) return user;
  }
  return User.findOne({ razorpaySubscriptionId: subscriptionEntity.id });
}

async function onSubscriptionActiveOrRenewed(subscriptionEntity) {
  const user = await findUserForSubscription(subscriptionEntity);
  if (!user) {
    console.warn(`[razorpay webhook] no user found for subscription ${subscriptionEntity.id}`);
    return;
  }

  const planKey = subscriptionEntity.notes?.planKey;
  const plan = PLANS[planKey];

  if (plan) user.plan = plan.key;
  user.razorpaySubscriptionId = subscriptionEntity.id;
  user.subscriptionStatus = "active";
  if (subscriptionEntity.current_end) {
    user.currentPeriodEnd = new Date(subscriptionEntity.current_end * 1000);
  }

  // A fresh billing cycle starting (subscription.charged on renewal)
  // should also reset usage, so paid users aren't stuck on last month's
  // count if the monthlyUsage.resetAt clock and Razorpay's cycle ever
  // drift apart.
  user.monthlyUsage.count = 0;
  const nextReset = new Date();
  nextReset.setMonth(nextReset.getMonth() + 1);
  user.monthlyUsage.resetAt = nextReset;

  await user.save();
  console.log(`[razorpay webhook] user ${user._id} activated/renewed on plan ${user.plan}`);
}

async function onSubscriptionPastDue(subscriptionEntity) {
  const user = await findUserForSubscription(subscriptionEntity);
  if (!user) return;

  user.subscriptionStatus = "past_due";
  await user.save();
  console.log(`[razorpay webhook] user ${user._id} marked past_due`);
}

async function onSubscriptionEnded(subscriptionEntity) {
  const user = await findUserForSubscription(subscriptionEntity);
  if (!user) return;

  user.plan = "free";
  user.subscriptionStatus = "cancelled";
  await user.save();
  console.log(`[razorpay webhook] user ${user._id} reverted to free plan`);
}
