const express = require("express");
const { createpost, viewpost, deletepost, downloadPostImage, regeneratePost, toggleFavorite, getFavoritePosts } = require("../controllers/postController");
const upload = require("../middleware/uploadMiddleware");
const { userMiddleware } = require("../middleware/UserMiddleware");


const router = express.Router();

router.post("/create", userMiddleware, upload.single("images"), createpost);
router.put("/regenerate/:id", userMiddleware, upload.single("images"), regeneratePost);

router.get("/listpost", userMiddleware, viewpost);
router.delete("/delete/:id", userMiddleware, deletepost);
router.get("/download/:id", userMiddleware, downloadPostImage);


router.patch("/favoritetoggle/:id", userMiddleware, toggleFavorite);
router.get("/favorites", userMiddleware, getFavoritePosts);


module.exports = router;  