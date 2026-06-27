const express = require("express");
const { handleRazorpayWebhook } = require("../controllers/webhookController");

const router = express.Router();

// NOTE: the express.raw() body parser for this route is applied in
// server.js, BEFORE app.use(express.json()) is mounted globally — see the
// comment there for why this route can't share the JSON parser.
router.post("/razorpay", handleRazorpayWebhook);

module.exports = router;
