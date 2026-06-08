const mongoose = require("mongoose");

const logoSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  images: {url: String,  public_id: String},
  name: { type: String, required: true },
  address: { type: String, required: true },
});

module.exports = mongoose.model("Logo", logoSchema);