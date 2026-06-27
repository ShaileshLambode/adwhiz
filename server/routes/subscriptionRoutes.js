const express = require("express");
const {
  listPlans,
  getMySubscription,
  createSubscription,
  verifyPayment,
  cancelSubscription,
} = require("../controllers/subscriptionController");
const { userMiddleware } = require("../middleware/UserMiddleware");

const router = express.Router();

router.get("/plans", userMiddleware, listPlans);
router.get("/me", userMiddleware, getMySubscription);
router.post("/create", userMiddleware, createSubscription);
router.post("/verify", userMiddleware, verifyPayment);
router.post("/cancel", userMiddleware, cancelSubscription);

module.exports = router;
