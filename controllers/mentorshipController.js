const MentorshipRequest = require('../models/MentorshipRequest');

// Send mentorship request
exports.sendRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const request = await MentorshipRequest.create({
      senderId: req.user.id, // Assuming JWT middleware attaches user ID
      receiverId,
    });

    res.status(201).json({ message: 'Request sent successfully', request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Accept or decline mentorship request
exports.respondToRequest = async (req, res) => {
  try {
    const { requestId, status } = req.body;
    const request = await MentorshipRequest.findByPk(requestId);

    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = status;
    await request.save();
    res.json({ message: 'Request status updated', request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
