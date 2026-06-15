const express = require("express");
const { createLogo, getLogo, updateLogo, deleteLogo } = require("../controllers/LogoController");
const upload = require("../middleware/uploadMiddleware");
const { userMiddleware } = require("../middleware/UserMiddleware");

const router = express.Router();

router.post("/add", userMiddleware, upload.single("image"), createLogo);
router.get("/list", userMiddleware, getLogo);
router.put("/update/:id", userMiddleware,upload.single("image"), updateLogo);
router.delete("/delete/:id", userMiddleware, deleteLogo);

module.exports = router; 