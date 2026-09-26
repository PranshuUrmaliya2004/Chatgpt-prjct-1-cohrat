

const express = require('express');
const authMiddleware = require('../middlewear/auth.middleware');
const { CreateChat, ListChats, DeleteChat } = require('../controllers/ChatController');


console.log("authMiddleware:", typeof authMiddleware);
console.log("CreateChat:", typeof CreateChat);

const router = express.Router();

router.post('/', authMiddleware, CreateChat);
router.get('/', authMiddleware, ListChats);
router.delete('/:chatId', authMiddleware, DeleteChat);

module.exports = router;