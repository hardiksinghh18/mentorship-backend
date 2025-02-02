const express = require('express');
const { sendMessage, getMessages } = require('../controllers/chatController');
const router = express.Router();

router.post('/send', sendMessage); // Send a message
router.get('/:senderId/:receiverId', getMessages); // Fetch messages

module.exports = router;
