const MentorshipRequest = require('../models/MentorshipRequest');
const User = require('../models/User');

// Send mentorship request
exports.sendRequest = async (req, res) => {
  try {

    const { receiverId, senderId } = req.body;

    // Validate if senderId and receiverId are valid
    if (!receiverId || !senderId) {
      return res.status(400).json({ error: 'Both senderId and receiverId are required' });
    }

    // Check if a request already exists
    const existingReq = await MentorshipRequest.findOne({
      where: { senderId, receiverId, status: 'pending' }
    });

    if (existingReq) {
      return res.status(409).json({ message: 'Request already sent to this profile' });
    }

    // Create a new mentorship request
    const request = await MentorshipRequest.create({ senderId, receiverId, status: 'pending' });

    return res.status(201).json({ message: 'Request sent successfully', request });
  } catch (error) {
    console.error('Error sending request:', error);
    res.status(500).json({ error: 'Failed to send the mentorship request' });
  }
};



exports.fetchRequests = async (req, res) => {
  try {
    // First, find the user by their username
    const user = await User.findOne({
      where: { username: req.params.username }, // Assuming the username is passed as a parameter
      attributes: ['id', 'username'], // You can specify other fields if needed
    });

    if (!user) {
      // If no user is found, return an error
      return res.status(404).json({ message: 'User not found' });
    }

    // Now, fetch mentorship requests based on the userId
    const requests = await MentorshipRequest.findAll({
      where: {
        receiverId: user.id, // Use the user's id to filter mentorship requests
      },
      include: [
        {
          model: User, // Include sender details
          as: 'sender',
          attributes: ['id', 'username', 'fullName', 'email', 'bio', 'role'], // Specify fields to include
        },
      ],
    });

    // Filter requests to ensure unique senderId
    const seenSenders = new Set();
    const uniqueRequests = requests.filter((request) => {
      if (!seenSenders.has(request.senderId)) {
        seenSenders.add(request.senderId);
        return true;
      }
      return false;
    });

    // Map over the unique requests to format the response
    const formattedRequests = uniqueRequests.map((request) => ({
      id: request.id,
      status: request.status,
      sender: request.sender ? request.sender.dataValues : null, // Include sender's user profile
      receiverId: request.receiverId,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    }));

    // Return the formatted unique requests with sender details
    res.json({ message: 'Fetched unique requests', requests: formattedRequests });
  } catch (error) {
    console.error('Error fetching unique requests:', error.message); // Log the error
    res.status(500).json({ error: error.message });
  }
};


exports.respondToRequest = async (req, res) => {
  try {
    const { receiverId, senderId, status } = req.body;

    // Validate incoming data
    if (!receiverId || !senderId || !status) {
      return res.status(400).json({ error: 'Receiver ID, Sender ID, and Status are required' });
    }

    // Find the mentorship request
    const request = await MentorshipRequest.findOne({ where: { senderId, receiverId } });

    // If request not found
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // If the status is declined, delete the request
    if (status === 'declined') {
      await request.destroy();
      return res.json({ success: true, message: 'Request declined and deleted' });
    }

    // If accepted, update request status
    if (status === 'accepted') {
      request.status = 'accepted';
      await request.save();

      // Check if a reverse request already exists
      const existingReverseRequest = await MentorshipRequest.findOne({ where: { senderId: receiverId, receiverId: senderId } });

      if (!existingReverseRequest) {
        // Create a reverse request to reflect the accepted status on both sides
        await MentorshipRequest.create({
          senderId: receiverId,
          receiverId: senderId,
          status: 'accepted',
        });
      } else {
        // If the reverse request exists, update its status
        existingReverseRequest.status = 'accepted';
        await existingReverseRequest.save();
      }

      return res.json({ success: true, message: 'Request accepted and updated on both sides' });
    }

    return res.status(400).json({ error: 'Invalid status value' });
  } catch (error) {
    console.error('Error responding to request:', error);
    res.status(500).json({ error: 'Failed to process the request' });
  }
};




exports.deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id) {
      return res.status(400).json({ error: 'Request ID is required' });
    }

    const request = await MentorshipRequest.findByPk(id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    await request.destroy();
    return res.json({ success: true, message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ error: 'Failed to delete the request' });
  }
};



exports.removeConnection = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    // Validate senderId and receiverId
    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'Sender ID and Receiver ID are required' });
    }

    // Find the accepted connection to remove
    const connection = await MentorshipRequest.findOne({
      where: { senderId, receiverId, status: 'accepted' },
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found or not accepted' });
    }

    // Remove the connection
    await connection.destroy();
    return res.json({ success: true, message: 'Connection removed successfully' });
  } catch (error) {
    console.error('Error removing connection:', error);
    res.status(500).json({ error: 'Failed to remove the connection' });
  }
};

