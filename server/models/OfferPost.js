const mongoose = require('mongoose');

const offerPostSchema = new mongoose.Schema({
  user:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  logo:              { type: mongoose.Schema.Types.ObjectId, ref: 'Logo', required: true },
  offerHeadline:     { type: String, required: true },
  offerDetails:      { type: String },
  validity:          { type: String },
  cta:               { type: String },
  accentColor:       { type: String, default: '#FFD700' },
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

module.exports = mongoose.model('OfferPost', offerPostSchema);
