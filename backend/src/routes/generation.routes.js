const express = require("express");
const authMiddleware = require("../middlewear/auth.middleware");
const {
  generatePdfController,
  generateImageController,
} = require("../controllers/generation.controller");

const router = express.Router();

router.post("/pdf", authMiddleware, generatePdfController);
router.post("/image", authMiddleware, generateImageController);

module.exports = router;