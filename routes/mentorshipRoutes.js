const express = require('express');
const mentorshipController = require('../controllers/mentorshipController');
const router = express.Router();

router.post('/send', mentorshipController.sendRequest);
router.put('/respond', mentorshipController.respondToRequest);
router.get('/requests/:username', mentorshipController.fetchRequests);
router.put('/requests/handleRequest', mentorshipController.respondToRequest); // Accept request
router.delete('/requests/:id/reject', mentorshipController.deleteRequest); // Delete request
router.delete('/remove', mentorshipController.removeConnection);

module.exports = router;
