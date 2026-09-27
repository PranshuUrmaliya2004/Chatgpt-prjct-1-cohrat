const express = require("express");
const authMiddleware = require("../middlewear/auth.middleware");
const {
  registerController,
  loginController,
  logoutController,
  currentUserController,
} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/logout", logoutController);
router.get("/me", authMiddleware, currentUserController);

module.exports = router;
