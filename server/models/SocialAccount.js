const mongoose = require('mongoose');

const socialAccountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['instagram'],
    default: 'instagram'
  },
  igUserId:         { type: String, required: true }, // Instagram-scoped user ID
  igUsername:       { type: String },                 // @handle
  profilePicUrl:    { type: String },
  accessToken:      { type: String, required: true }, // long-lived token
  tokenExpiresAt:   { type: Date },                   // 60 days from issue
  connectedAt:      { type: Date, default: Date.now },
  lastRefreshedAt:  { type: Date },
}, { timestamps: true });

// One social account per platform per AdWhiz user
socialAccountSchema.index({ user: 1, platform: 1 }, { unique: true });

module.exports = mongoose.model('SocialAccount', socialAccountSchema);
