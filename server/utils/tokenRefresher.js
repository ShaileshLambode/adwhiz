const cron   = require('node-cron');
const axios  = require('axios');
const SocialAccount = require('../models/SocialAccount');

function startTokenRefreshJob() {
  // Run daily at 3am
  cron.schedule('0 3 * * *', async () => {
    console.log('[TokenRefresher] Checking Instagram tokens for refresh...');
    const inTenDays = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    // Find tokens expiring within 10 days that are at least 24h old
    const accounts = await SocialAccount.find({
      platform: 'instagram',
      tokenExpiresAt: { $lte: inTenDays },
      lastRefreshedAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    for (const account of accounts) {
      try {
        const refreshRes = await axios.get('https://graph.instagram.com/refresh_access_token', {
          params: {
            grant_type:   'ig_refresh_token',
            access_token: account.accessToken,
          }
        });
        const newToken   = refreshRes.data.access_token;
        const expiresIn  = refreshRes.data.expires_in;
        const newExpiry  = new Date(Date.now() + expiresIn * 1000);

        await SocialAccount.findByIdAndUpdate(account._id, {
          accessToken:     newToken,
          tokenExpiresAt:  newExpiry,
          lastRefreshedAt: new Date(),
        });
        console.log(`[TokenRefresher] Refreshed token for user ${account.user}`);
      } catch (err) {
        console.error(`[TokenRefresher] Failed to refresh token for ${account.user}:`, err.message);
        // Token expired — mark as needing reconnect (just log, don't delete)
      }
    }
  });
}

module.exports = { startTokenRefreshJob };
