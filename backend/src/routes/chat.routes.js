

const express = require('express');
const authMiddleware = require('../middlewear/auth.middleware');
const { CreateChat } = require('../controllers/ChatController');


console.log("authMiddleware:", typeof authMiddleware);
console.log("CreateChat:", typeof CreateChat);

const router = express.Router();

router.post('/', authMiddleware, CreateChat);

module.exports = router;