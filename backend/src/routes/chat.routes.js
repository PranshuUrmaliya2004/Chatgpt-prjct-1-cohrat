const express = require("express");
const authMiddleware = require("../middlewear/auth.middleware");
const {
  CreateChat,
  ListChats,
  DeleteChat,
} = require("../controllers/ChatController");

const router = express.Router();

router.post("/", authMiddleware, CreateChat);
router.get("/", authMiddleware, ListChats);
router.delete("/:chatId", authMiddleware, DeleteChat);

module.exports = router;
