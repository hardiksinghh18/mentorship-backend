const express = require('express');
const mentorshipController = require('../controllers/mentorshipController');
const router = express.Router();

router.post('/send', mentorshipController.sendRequest);
router.put('/respond', mentorshipController.respondToRequest);

module.exports = router;
