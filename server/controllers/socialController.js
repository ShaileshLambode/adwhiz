const axios = require('axios');
const SocialAccount = require('../models/SocialAccount');
const PromoPost = require('../models/PromoPost');

// ── Step 1: Generate Instagram OAuth URL ─────────────────────────────────────
exports.getInstagramAuthUrl = async (req, res) => {
  const userId = req.user.id;   // from userMiddleware
  const scope = 'instagram_business_basic,instagram_business_content_publish';
  const url = `https://www.instagram.com/oauth/authorize`
    + `?client_id=${process.env.INSTAGRAM_APP_ID}`
    + `&redirect_uri=${encodeURIComponent(process.env.INSTAGRAM_REDIRECT_URI)}`
    + `&response_type=code`
    + `&scope=${scope}`
    + `&state=${userId}`;   // pass userId in state so callback knows which user

  return res.json({ authUrl: url });
};

// ── Step 2: Handle OAuth Callback ─────────────────────────────────────────────
// This is called by Meta after user approves — state param carries AdWhiz userId
exports.handleInstagramCallback = async (req, res) => {
  try {
    const { code, state: userId, error } = req.query;

    if (error || !code) {
      // User denied permission — redirect to frontend with error
      return res.redirect(
        `${process.env.CLIENT_URL}/settings/social?error=instagram_denied`
      );
    }

    // Exchange code for short-lived token using x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('client_id', process.env.INSTAGRAM_APP_ID);
    params.append('client_secret', process.env.INSTAGRAM_APP_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', process.env.INSTAGRAM_REDIRECT_URI);
    params.append('code', code);

    const tokenRes = await axios.post('https://api.instagram.com/oauth/access_token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const { access_token: shortToken, user_id: igUserId } = tokenRes.data;

    // Exchange short-lived → long-lived (60 days)
    const longTokenRes = await axios.get('https://graph.instagram.com/access_token', {
      params: {
        grant_type:    'ig_exchange_token',
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        access_token:  shortToken,
      }
    });
    const longToken  = longTokenRes.data.access_token;
    const expiresIn  = longTokenRes.data.expires_in;  // seconds
    const expiresAt  = new Date(Date.now() + expiresIn * 1000);

    // Fetch Instagram profile info (username + profile pic) using /me
    const profileRes = await axios.get('https://graph.instagram.com/v25.0/me', {
      params: {
        fields:       'id,username,profile_picture_url',
        access_token: longToken,
      }
    });
    const { id: profileIgUserId, username, profile_picture_url } = profileRes.data;
    const finalIgUserId = profileIgUserId || igUserId;

    // Upsert SocialAccount
    await SocialAccount.findOneAndUpdate(
      { user: userId, platform: 'instagram' },
      {
        igUserId:        finalIgUserId,
        igUsername:      username,
        profilePicUrl:   profile_picture_url,
        accessToken:     longToken,
        tokenExpiresAt:  expiresAt,
        lastRefreshedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Redirect back to frontend with success
    return res.redirect(`${process.env.CLIENT_URL}/settings/social?connected=instagram`);

  } catch (err) {
    console.error('Instagram callback error:', err?.response?.data || err.message);
    return res.redirect(`${process.env.CLIENT_URL}/settings/social?error=instagram_failed`);
  }
};

// ── Get connected account info ────────────────────────────────────────────────
exports.getConnectedAccount = async (req, res) => {
  try {
    const account = await SocialAccount.findOne({
      user: req.user.id,
      platform: 'instagram'
    }).lean();

    if (!account) return res.json({ connected: false });

    const isExpired = account.tokenExpiresAt && new Date() > account.tokenExpiresAt;
    return res.json({
      connected:       true,
      username:        account.igUsername,
      profilePicUrl:   account.profilePicUrl,
      tokenExpiresAt:  account.tokenExpiresAt,
      needsReconnect:  isExpired,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get account info' });
  }
};

// ── Disconnect ────────────────────────────────────────────────────────────────
exports.disconnectAccount = async (req, res) => {
  try {
    await SocialAccount.deleteOne({ user: req.user.id, platform: 'instagram' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to disconnect account' });
  }
};

// ── Publish to Instagram ──────────────────────────────────────────────────────
exports.publishToInstagram = async (req, res) => {
  try {
    const { promoPostId, caption } = req.body;
    const userId = req.user.id;

    if (!promoPostId) {
      return res.status(400).json({ error: 'promoPostId is required' });
    }

    // Get the post to get its Cloudinary image URL (checks PromoPost, QuotePost, and OfferPost)
    let promoPost = await PromoPost.findOne({ _id: promoPostId, user: userId });
    let postModelType = 'PromoPost';
    
    if (!promoPost) {
      const QuotePost = require('../models/QuotePost');
      promoPost = await QuotePost.findOne({ _id: promoPostId, user: userId });
      postModelType = 'QuotePost';
    }
    
    if (!promoPost) {
      const OfferPost = require('../models/OfferPost');
      promoPost = await OfferPost.findOne({ _id: promoPostId, user: userId });
      postModelType = 'OfferPost';
    }

    if (!promoPost || !promoPost.generatedImageUrl) {
      return res.status(404).json({ error: 'Post not found or has no image' });
    }

    // Get the user's connected Instagram account
    const socialAccount = await SocialAccount.findOne({ user: userId, platform: 'instagram' });
    if (!socialAccount) {
      return res.status(400).json({ error: 'No Instagram account connected. Please connect first.' });
    }

    // Check token expiry
    if (socialAccount.tokenExpiresAt && new Date() > socialAccount.tokenExpiresAt) {
      return res.status(401).json({
        error: 'Instagram session expired. Please reconnect your account.',
        needsReconnect: true
      });
    }

    const accessToken = socialAccount.accessToken;
    const igUserId    = socialAccount.igUserId;

    // ── Step 1: Create media container ──────────────────────────────────────
    const containerRes = await axios.post(
      `https://graph.instagram.com/v25.0/${igUserId}/media`,
      null,
      {
        params: {
          image_url:    promoPost.generatedImageUrl,  // Cloudinary URL — already public
          caption:      caption || '',
          access_token: accessToken,
        }
      }
    );
    const containerId = containerRes.data.id;

    // ── Step 2: Check container status (optional but recommended) ───────────
    // Retry up to 5 times, 1 second apart, in case Meta is still processing
    let isReady = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise(r => setTimeout(r, 1000));
      const statusRes = await axios.get(
        `https://graph.instagram.com/v25.0/${containerId}`,
        { params: { fields: 'status_code', access_token: accessToken } }
      );
      const statusCode = statusRes.data.status_code;
      if (statusCode === 'FINISHED') { isReady = true; break; }
      if (statusCode === 'ERROR')    { throw new Error('Meta container processing failed'); }
      if (statusCode === 'EXPIRED')  { throw new Error('Media container expired'); }
    }
    if (!isReady) {
      // Proceed anyway — most images process fast enough
      console.warn('Container status check timed out, attempting publish anyway');
    }

    // ── Step 3: Publish the container ────────────────────────────────────────
    const publishRes = await axios.post(
      `https://graph.instagram.com/v25.0/${igUserId}/media_publish`,
      null,
      {
        params: {
          creation_id:  containerId,
          access_token: accessToken,
        }
      }
    );
    const igMediaId = publishRes.data.id;

    // Save the published post ID to the correct post record
    if (postModelType === 'PromoPost') {
      await PromoPost.findByIdAndUpdate(promoPostId, {
        $push: {
          socialPosts: {
            platform:       'instagram',
            externalPostId: igMediaId,
            caption:        caption || '',
            publishedAt:    new Date()
          }
        }
      });
    } else if (postModelType === 'QuotePost') {
      const QuotePost = require('../models/QuotePost');
      await QuotePost.findByIdAndUpdate(promoPostId, {
        $push: {
          socialPosts: {
            platform:       'instagram',
            externalPostId: igMediaId,
            caption:        caption || '',
            publishedAt:    new Date()
          }
        }
      });
    } else if (postModelType === 'OfferPost') {
      const OfferPost = require('../models/OfferPost');
      await OfferPost.findByIdAndUpdate(promoPostId, {
        $push: {
          socialPosts: {
            platform:       'instagram',
            externalPostId: igMediaId,
            caption:        caption || '',
            publishedAt:    new Date()
          }
        }
      });
    }

    return res.status(200).json({
      success:   true,
      igMediaId,
      message:   `Successfully posted to @${socialAccount.igUsername}`
    });

  } catch (err) {
    const metaError = err?.response?.data?.error;
    console.error('Instagram publish error:', metaError || err.message);

    if (metaError?.code === 190) {
      return res.status(401).json({
        error: 'Instagram session expired. Please reconnect.',
        needsReconnect: true
      });
    }
    return res.status(500).json({
      error: metaError?.message || 'Failed to publish to Instagram'
    });
  }
};
