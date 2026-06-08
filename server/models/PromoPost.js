const mongoose = require("mongoose");

const promoPostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  logo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Logo",
    required: true
  },
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ImageTemplate"
  },
  occasion: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: "1024x1024"
  },
  textInputs: [{
    id: String,
    value: String
  }],
  generatedImageUrl: {
    type: String
  },
  favorite: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("PromoPost", promoPostSchema);
