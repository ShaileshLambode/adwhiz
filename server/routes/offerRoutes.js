const express = require('express');
const { generateOfferPost, listOfferPosts, deleteOfferPost, toggleOfferFavorite, downloadOffer } = require('../controllers/offerController');
const { userMiddleware } = require('../middleware/UserMiddleware');
const router = express.Router();

router.post('/generate',      userMiddleware, generateOfferPost);
router.get('/list',           userMiddleware, listOfferPosts);
router.delete('/delete/:id',  userMiddleware, deleteOfferPost);
router.patch('/favorite/:id', userMiddleware, toggleOfferFavorite);
router.get('/download/:id',     userMiddleware, downloadOffer);

module.exports = router;
