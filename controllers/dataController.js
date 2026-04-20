

const { Op } = require('sequelize');
const User = require('../models/User');
const MentorshipRequest = require('../models/MentorshipRequest');

exports.fetchAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { role, name, skills, interests } = req.query;
    const where = {};

    if (role) where.role = role;
    if (name) {
      where[Op.or] = [
        { fullName: { [Op.like]: `%${name}%` } },
        { username: { [Op.like]: `%${name}%` } }
      ];
    }
    
    // MySQL compatible JSON filtering using LIKE
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim().toLowerCase());
      where[Op.and] = skillsArray.map(skill => ({
        skills: { [Op.like]: `%${skill}%` }
      }));
    }
    
    if (interests) {
      const interestsArray = interests.split(',').map(i => i.trim().toLowerCase());
      where[Op.and] = (where[Op.and] || []).concat(interestsArray.map(interest => ({
        interests: { [Op.like]: `%${interest}%` }
      })));
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      include: [
        {
          model: MentorshipRequest,
          as: 'sentRequests',
          where: { status: { [Op.ne]: 'declined' } },
          required: false,
        },
        {
          model: MentorshipRequest,
          as: 'receivedRequests',
          where: { status: { [Op.ne]: 'declined' } },
          required: false,
        },
      ],
      offset: offset,
      limit: limit,
      distinct: true,
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({ 
      users, 
      totalCount: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      hasMore: page * limit < count,
      message: 'Fetched data for profiles' 
    });
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
