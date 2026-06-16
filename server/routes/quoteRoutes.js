const express = require('express');
const { generateQuotePost, listQuotePosts, deleteQuotePost, toggleQuoteFavorite, downloadQuote } = require('../controllers/quoteController');
const { userMiddleware } = require('../middleware/UserMiddleware');
const router = express.Router();

router.post('/generate',        userMiddleware, generateQuotePost);
router.get('/list',             userMiddleware, listQuotePosts);
router.delete('/delete/:id',    userMiddleware, deleteQuotePost);
router.patch('/favorite/:id',   userMiddleware, toggleQuoteFavorite);
router.get('/download/:id',     userMiddleware, downloadQuote);

module.exports = router;
