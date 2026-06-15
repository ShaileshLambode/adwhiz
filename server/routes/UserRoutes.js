const express = require("express");
const { signup, googleAuth, login, googleLogin, users, forgotpassword, Changepassword} = require("../controllers/UserController");
const { userMiddleware } = require("../middleware/UserMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/google-auth", googleAuth);
router.post("/login", login);
router.post("/google-login", googleLogin);
router.get('/users', userMiddleware, users);
router.post('/fpassword', forgotpassword);
router.post('/changepassword/:id/:token', Changepassword);

module.exports = router;