const express = require('express');
const {
  getInstagramAuthUrl,
  handleInstagramCallback,
  getConnectedAccount,
  disconnectAccount,
  publishToInstagram,
} = require('../controllers/socialController');
const { userMiddleware } = require('../middleware/UserMiddleware');

const router = express.Router();

// OAuth flow
router.get('/instagram/auth-url',    userMiddleware, getInstagramAuthUrl);
router.get('/instagram/callback',    handleInstagramCallback);   // no auth — receives OAuth code

// Account management
router.get('/account',               userMiddleware, getConnectedAccount);
router.delete('/disconnect',         userMiddleware, disconnectAccount);

// Publishing
router.post('/publish/instagram',    userMiddleware, publishToInstagram);

module.exports = router;
