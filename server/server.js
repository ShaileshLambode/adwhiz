require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const UserRoutes = require("./routes/UserRoutes");
const LogoRoutes = require("./routes/LogoRoutes");
const postRoutes = require("./routes/postRoutes");
const promoRoutes = require("./routes/promoRoutes");
const { connectDB } = require("./config/db");
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;

connectDB();

app.use(cors());

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
