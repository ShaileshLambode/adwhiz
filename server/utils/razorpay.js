const Razorpay = require("razorpay");

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn(
    "[razorpay] RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — " +
    "subscription routes will fail until these are configured in .env"
  );
}

let razorpayInstance = null;

const handler = {
  get(target, prop) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error(
        "Razorpay SDK is not initialized because RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing in .env"
      );
    }
    if (!razorpayInstance) {
      razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    }
    return razorpayInstance[prop];
  }
};

// Export a proxy that initializes Razorpay lazily on the first property access.
const razorpay = new Proxy({}, handler);

module.exports = razorpay;
