const mongoose = require('mongoose');

const quotePostSchema = new mongoose.Schema({
  user:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  logo:              { type: mongoose.Schema.Types.ObjectId, ref: 'Logo', required: true },
  theme:             { type: String, required: true },
  tone:              { type: String, default: 'inspirational' },
  quoteText:         { type: String },
  attribution:       { type: String },
  size:              { type: String, default: '1024x1024' },
  generatedImageUrl: { type: String },
  favorite:          { type: Boolean, default: false },
  socialPosts:       [{
    platform:       String,
    externalPostId: String,
    caption:        String,
    publishedAt:    { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('QuotePost', quotePostSchema);
