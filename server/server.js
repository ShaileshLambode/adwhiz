require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const UserRoutes = require("./routes/UserRoutes");
const LogoRoutes = require("./routes/LogoRoutes");
const postRoutes = require("./routes/postRoutes");
const promoRoutes = require("./routes/promoRoutes");
const quoteRoutes = require("./routes/quoteRoutes");
const offerRoutes = require("./routes/offerRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const { connectDB } = require("./config/db");
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;

connectDB();

app.use(cors());

// ─── Razorpay webhook: MUST be mounted with express.raw() and BEFORE
// express.json() below. Razorpay signs the exact raw request body; once
// express.json() parses it, re-stringifying the parsed object is not
// guaranteed to byte-match the original, which breaks signature
// verification. Keeping this above the global json() call is what makes
// req.body a raw Buffer inside webhookController instead of a parsed object.
app.use("/api/webhooks", express.raw({ type: "application/json" }), webhookRoutes);

app.use(express.json());


app.use("/uploads", express.static("uploads"));

// User Login
app.use("/api/user", UserRoutes);

// Logo upload
app.use("/api/logo", LogoRoutes);

// Generate Post
app.use("/api/post", postRoutes);

// Promotional Image Generation
app.use("/api/promo", promoRoutes);

app.use("/api/quote", quoteRoutes);
app.use("/api/offer", offerRoutes);

// Subscription / Billing (Razorpay)
app.use("/api/subscription", subscriptionRoutes);

// Social Media Integration (Instagram)
const socialRoutes = require("./routes/socialRoutes");
app.use("/api/social", socialRoutes);

// Start Token Auto-Refresh Cron Job
const { startTokenRefreshJob } = require("./utils/tokenRefresher");
startTokenRefreshJob();

app.listen(PORT, () => console.log(`Server running on port ${PORT}`) || 4000);

// add this code
app.get('/', (req, res) => {
  res.send('API is running...');
});
