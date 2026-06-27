const express = require("express");
const {
  listTemplates,
  generatePromo,
  listPromos,
  deletePromo,
  downloadPromo,
  togglePromoFavorite,
  regeneratePromo,
  aiFillContent,
  uploadProductImage,
} = require("../controllers/promoController");
const { userMiddleware } = require("../middleware/UserMiddleware");
const { checkUsageLimit } = require("../middleware/usageMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Template listing (for occasion picker)
router.get("/templates", userMiddleware, listTemplates);

// AI content fill
router.post("/ai-fill", userMiddleware, aiFillContent);

// Promo post CRUD
router.post("/generate", userMiddleware, checkUsageLimit, generatePromo);
router.get("/list", userMiddleware, listPromos);
router.delete("/delete/:id", userMiddleware, deletePromo);
router.get("/download/:id", userMiddleware, downloadPromo);
router.patch("/favorite/:id", userMiddleware, togglePromoFavorite);
router.put("/regenerate/:id", userMiddleware, checkUsageLimit, regeneratePromo);
router.post("/upload-product-image", userMiddleware, upload.single("image"), uploadProductImage);

module.exports = router;
