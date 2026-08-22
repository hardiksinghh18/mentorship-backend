const MentorshipRequest = require('../models/MentorshipRequest');
const User = require('../models/User');

// Send mentorship request
exports.sendRequest = async (req, res, next) => {
  try {
    const { receiverId, senderId } = req.body;

    // Validate if senderId and receiverId are valid
    if (!receiverId || !senderId) {
      const error = new Error('Both senderId and receiverId are required');
      error.statusCode = 400;
      throw error;
    }

    // Check if a request already exists
    const existingReq = await MentorshipRequest.findOne({
      where: { senderId, receiverId, status: 'pending' }
    });

    if (existingReq) {
      const error = new Error('Request already sent to this profile');
      error.statusCode = 409;
      throw error;
    }

    // Create a new mentorship request
    const request = await MentorshipRequest.create({ senderId, receiverId, status: 'pending' });

    return res.status(201).json({ message: 'Request sent successfully', request });
  } catch (error) {
    next(error);
  }
};

// Fetch incoming requests for a user
exports.fetchRequests = async (req, res, next) => {
  try {
    // First, find the user by their username
    const user = await User.findOne({
      where: { username: req.params.username },
      attributes: ['id', 'username'],
    });

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Now, fetch mentorship requests based on the userId
    const requests = await MentorshipRequest.findAll({
      where: {
        receiverId: user.id,
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'fullName', 'email', 'bio', 'role'],
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
      sender: request.sender ? request.sender.dataValues : null,
      receiverId: request.receiverId,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    }));

    res.json({ message: 'Fetched unique requests', requests: formattedRequests });
  } catch (error) {
    next(error);
  }
};

// Accept or decline incoming requests
exports.respondToRequest = async (req, res, next) => {
  try {
    const { receiverId, senderId, status } = req.body;

    // Validate incoming data
    if (!receiverId || !senderId || !status) {
      const error = new Error('Receiver ID, Sender ID, and Status are required');
      error.statusCode = 400;
      throw error;
    }

    // Find the mentorship request
    const request = await MentorshipRequest.findOne({ where: { senderId, receiverId } });

    // If request not found
    if (!request) {
      const error = new Error('Request not found');
      error.statusCode = 404;
      throw error;
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

    const error = new Error('Invalid status value');
    error.statusCode = 400;
    throw error;
  } catch (error) {
    next(error);
  }
};

// Delete a mentorship request
exports.deleteRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id) {
      const error = new Error('Request ID is required');
      error.statusCode = 400;
      throw error;
    }

    const request = await MentorshipRequest.findByPk(id);

    if (!request) {
      const error = new Error('Request not found');
      error.statusCode = 404;
      throw error;
    }

    await request.destroy();
    return res.json({ success: true, message: 'Request deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Remove a connection
exports.removeConnection = async (req, res, next) => {
  try {
    const { senderId, receiverId } = req.body;

    // Validate senderId and receiverId
    if (!senderId || !receiverId) {
      const error = new Error('Sender ID and Receiver ID are required');
      error.statusCode = 400;
      throw error;
    }

    // Find the accepted connection to remove
    const connection = await MentorshipRequest.findOne({
      where: { senderId, receiverId, status: 'accepted' },
    });

    if (!connection) {
      const error = new Error('Connection not found or not accepted');
      error.statusCode = 404;
      throw error;
    }

    // Remove the connection
    await connection.destroy();
    return res.json({ success: true, message: 'Connection removed successfully' });
  } catch (error) {
    next(error);
  }
};
