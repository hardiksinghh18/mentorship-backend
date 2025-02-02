

const { Op } = require('sequelize');
const User = require('../models/User');
const MentorshipRequest = require('../models/MentorshipRequest');

exports.fetchAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }, // Exclude sensitive fields like passwords
      include: [
        {
          model: MentorshipRequest,
          as: 'sentRequests', // Include sent requests
          where: { status: { [Op.ne]: 'declined' } }, // Filter to exclude declined requests, if needed
          required: false, // Optional: If you want users with no connections to appear as well
        },
        {
          model: MentorshipRequest,
          as: 'receivedRequests', // Include received requests
          where: { status: { [Op.ne]: 'declined' } }, // Filter to exclude declined requests, if needed
          required: false, // Optional: If you want users with no connections to appear as well
        },
      ],
    });

    res.status(200).json({ users, message: 'Fetched data for all profiles' });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



exports.fetchSingleUser = async (req, res) => {
  try {
   
    const user = await User.findOne({
      where: { username: req.params.username },
      attributes: { exclude: ['password'] },  // Exclude sensitive data like password
      include: [
        {
          model: MentorshipRequest,
          as: 'sentRequests', // Include sent requests
          where: { status: { [Op.ne]: 'declined' } }, // Exclude declined requests
          required: false, // Optional: Users without sent requests will also be returned
        },
        {
          model: MentorshipRequest,
          as: 'receivedRequests', // Include received requests
          where: { status: { [Op.ne]: 'declined' } }, // Exclude declined requests
          required: false, // Optional: Users without received requests will also be returned
        },
      ],
    });
    

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user, message: 'Fetched data successfully' });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.fetchSingleUserById = async (req, res) => {
  try {
   
    const user = await User.findOne({
      where: { id: req.params.id },
      attributes: { exclude: ['password'] },  // Exclude sensitive data like password
      
    });
    

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user, message: 'Fetched data successfully' });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
