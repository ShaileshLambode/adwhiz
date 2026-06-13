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
  layoutType: {
    type: String,
    default: "infographic"
  },
  textInputs: [{
    id: String,
    value: String
  }],
  userOverrides: {
    heroContent: {
      headline:      String,
      subheading:    String,
      bodyMessage:   String,
      closingSlogan: String,
      rightBoxQuote: String,
    },
    valuesRow:         [{ icon: String, label: String, sublabel: String }],
    featuresBar:       [{ icon: String, text: String }],
    productCategories: [{ imageUrl: String, cloudinaryPublicId: String, name: String }],
    footerColumns:     [{ icon: String, lines: [String], highlight: String }],
  },
  generatedImageUrl: {
    type: String
  },
  favorite: {
    type: Boolean,
    default: false
  },
  socialPosts: [{
    platform:       String,              // 'instagram'
    externalPostId: String,              // Instagram media ID returned after publish
    caption:        String,
    publishedAt:    { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model("PromoPost", promoPostSchema);
