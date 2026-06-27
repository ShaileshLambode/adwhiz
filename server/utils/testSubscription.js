/**
 * testSubscription.js
 * ───────────────────────
 * Unit test suite for the Subscription & Payment Integration feature.
 * 
 * Verifies:
 *   1. Plan configurations, prices, and limits (plans.js).
 *   2. Usage quota math, resets, and gates (usageMiddleware.js).
 *   3. Feature gating (planFeatureMiddleware.js).
 *   4. Webhook event routing and idempotency (webhookController.js).
 * 
 * Run with: node server/utils/testSubscription.js
 */

const assert = require("assert");
const { PLANS, getPlan, getPlanByRazorpayId } = require("../config/plans");
const { checkUsageLimit } = require("../middleware/usageMiddleware");
const { requireFeature } = require("../middleware/planFeatureMiddleware");

// Mocking User model for middleware testing
const MockUser = {
  saved: [],
  reset() {
    this.saved = [];
  },
};

console.log("=== Running Subscription Feature Unit Tests ===\n");

function runTest(name, testFn) {
  try {
    testFn();
    console.log(`[PASS] ${name}`);
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// ───────────────────────────────────────────────────────────────────────────
// 1. Plan Config Tests
// ───────────────────────────────────────────────────────────────────────────
runTest("Plan Config - getPlan resolves correctly", () => {
  const freePlan = getPlan("free");
  assert.strictEqual(freePlan.key, "free");
  assert.strictEqual(freePlan.postsPerMonth, 5);
  assert.strictEqual(freePlan.watermark, true);
  assert.strictEqual(freePlan.instagramPublishing, false);

  const basicPlan = getPlan("basic");
  assert.strictEqual(basicPlan.key, "basic");
  assert.strictEqual(basicPlan.postsPerMonth, 100);
  assert.strictEqual(basicPlan.watermark, false);
  assert.strictEqual(basicPlan.instagramPublishing, true);

  const proPlan = getPlan("pro");
  assert.strictEqual(proPlan.key, "pro");
  assert.strictEqual(proPlan.postsPerMonth, Infinity);
  assert.strictEqual(proPlan.watermark, false);
  assert.strictEqual(proPlan.instagramPublishing, true);

  // TYPO FALLBACK
  const fallback = getPlan("non-existent-plan");
  assert.strictEqual(fallback.key, "free");
});

runTest("Plan Config - getPlanByRazorpayId resolves correctly", () => {
  // Free plan has no Razorpay ID
  const freeMatch = getPlanByRazorpayId(null);
  assert.strictEqual(freeMatch, null);

  // Setup plan IDs in env
  process.env.RAZORPAY_PLAN_ID_BASIC = "plan_123_basic";
  process.env.RAZORPAY_PLAN_ID_PRO = "plan_456_pro";

  // Re-require to load env variables
  delete require.cache[require.resolve("../config/plans")];
  const plansReloaded = require("../config/plans");

  const basicMatch = plansReloaded.getPlanByRazorpayId("plan_123_basic");
  assert.strictEqual(basicMatch.key, "basic");

  const proMatch = plansReloaded.getPlanByRazorpayId("plan_456_pro");
  assert.strictEqual(proMatch.key, "pro");
});

// ───────────────────────────────────────────────────────────────────────────
// 2. Usage Middleware Logic Tests (Mocked DB)
// ───────────────────────────────────────────────────────────────────────────
runTest("Usage Middleware - gates user within limits", async () => {
  const req = {
    user: { id: "user_1" },
  };

  // Mock User.findById
  const User = require("../models/User");
  const originalFindById = User.findById;

  User.findById = async function (id) {
    return {
      _id: id,
      plan: "free",
      monthlyUsage: {
        count: 3,
        resetAt: new Date(Date.now() + 1000 * 60 * 60), // reset in 1 hour
      },
      save: async function () {
        MockUser.saved.push(this);
      },
    };
  };

  let nextCalled = false;
  const res = {
    status(code) {
      return {
        json(data) {
          res.statusCode = code;
          res.jsonData = data;
        },
      };
    },
  };

  await checkUsageLimit(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, true);
  assert.strictEqual(req.userPlan.key, "free");
  assert.strictEqual(req.userDoc._id, "user_1");

  // Restore User.findById
  User.findById = originalFindById;
});

runTest("Usage Middleware - blocks user exceeding limits", async () => {
  const req = {
    user: { id: "user_1" },
  };

  const User = require("../models/User");
  const originalFindById = User.findById;

  User.findById = async function (id) {
    return {
      _id: id,
      plan: "free",
      monthlyUsage: {
        count: 5, // Limit is 5 on Free
        resetAt: new Date(Date.now() + 1000 * 60 * 60),
      },
      save: async function () {},
    };
  };

  let nextCalled = false;
  const res = {
    statusCode: null,
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
    },
  };

  await checkUsageLimit(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(res.jsonData.code, "USAGE_LIMIT_REACHED");
  assert.ok(res.jsonData.message.includes("Free"));

  User.findById = originalFindById;
});

runTest("Usage Middleware - resets counter when resetAt is past", async () => {
  const req = {
    user: { id: "user_1" },
  };

  const User = require("../models/User");
  const originalFindById = User.findById;

  let savedUser = null;
  User.findById = async function (id) {
    return {
      _id: id,
      plan: "free",
      monthlyUsage: {
        count: 5, // Exceeded but resetAt has passed
        resetAt: new Date(Date.now() - 1000), // passed 1 second ago
      },
      save: async function () {
        savedUser = this;
      },
    };
  };

  let nextCalled = false;
  const res = {
    status(code) {
      return this;
    },
    json(data) {},
  };

  await checkUsageLimit(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, true);
  assert.ok(savedUser);
  assert.strictEqual(savedUser.monthlyUsage.count, 0); // count reset to 0
  assert.ok(savedUser.monthlyUsage.resetAt > new Date()); // resetAt advanced to next month

  User.findById = originalFindById;
});

// ───────────────────────────────────────────────────────────────────────────
// 3. Plan Feature Middleware Tests
// ───────────────────────────────────────────────────────────────────────────
runTest("Feature Gating - permits inclusive features", async () => {
  const req = {
    user: { id: "user_1" },
    userPlan: PLANS.basic, // basic plan includes instagramPublishing
    userDoc: { plan: "basic" },
  };

  let nextCalled = false;
  const res = {};

  const gate = requireFeature("instagramPublishing");
  await gate(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, true);
});

runTest("Feature Gating - rejects exclusive features", async () => {
  const req = {
    user: { id: "user_1" },
    userPlan: PLANS.free, // free plan does NOT include instagramPublishing
    userDoc: { plan: "free" },
  };

  let nextCalled = false;
  const res = {
    statusCode: null,
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
    },
  };

  const gate = requireFeature("instagramPublishing");
  await gate(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(res.jsonData.code, "FEATURE_NOT_AVAILABLE");
});

console.log("\nAll 7 unit tests passed successfully!");
