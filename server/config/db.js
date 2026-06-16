const mongoose = require("mongoose");
const dns = require("dns");

try {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
} catch (err) {
  console.warn("Failed to set custom DNS servers:", err.message);
}
 
exports.connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("Database connection failed", error);
    process.exit(1);
  }
};
