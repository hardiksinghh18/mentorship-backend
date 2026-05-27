

const { Op } = require('sequelize');
const User = require('../models/User');
const MentorshipRequest = require('../models/MentorshipRequest');

exports.fetchAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { role, name, skills, currentUserId, minExperience, connectionStatus } = req.query;
    console.log("Fetching users with filters:", { role, name, skills, currentUserId, minExperience, connectionStatus });

    const sequelize = User.sequelize;
    const where = {
      role: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
      bio: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
      [Op.and]: [
        sequelize.where(sequelize.fn('JSON_LENGTH', sequelize.col('skills')), { [Op.gt]: 0 }),
        sequelize.where(sequelize.fn('JSON_LENGTH', sequelize.col('education')), { [Op.gt]: 0 }),
        sequelize.where(sequelize.fn('JSON_LENGTH', sequelize.col('experience')), { [Op.gt]: 0 })
      ]
    };

    // Exclude current user if ID is provided
    if (currentUserId) {
      where.id = { [Op.ne]: currentUserId };
    }

    if (role && role !== "" && role !== "All Members") {
      where.role = role;
    }

    if (name && name.trim() !== "") {
      const searchVal = name.trim();
      where[Op.or] = [
        { fullName: { [Op.like]: `%${searchVal}%` } },
        { username: { [Op.like]: `%${searchVal}%` } }
      ];
    }

    if (skills && skills.trim() !== "") {
      const skillsArray = skills.split(',').map(s => s.trim().toLowerCase()).filter(s => s !== "");
      if (skillsArray.length > 0) {
        const User = require('../models/User'); // Ensure access to sequelize
        const sequelize = User.sequelize;

        where[Op.and] = where[Op.and] || [];
        where[Op.and].push({
          [Op.or]: skillsArray.map(skill => (
            sequelize.where(
              sequelize.fn('LOWER', sequelize.cast(sequelize.col('skills'), 'CHAR')),
              { [Op.like]: `%${skill}%` }
            )
          ))
        });
      }
    }

    if (minExperience) {
      const exp = parseInt(minExperience);
      if (!isNaN(exp)) {
        where.yearsOfExperience = { [Op.gte]: exp };
      }
    }

    if (connectionStatus && connectionStatus !== 'all' && currentUserId) {
      const User = require('../models/User'); // Ensure access to sequelize
      const sequelize = User.sequelize;

      // Use a more robust way to merge connection status into where clause
      where[Op.and] = where[Op.and] || [];

      if (connectionStatus === 'connected') {
        where[Op.and].push({
          [Op.or]: [
            { id: { [Op.in]: sequelize.literal(`(SELECT receiverId FROM MentorshipRequests WHERE senderId = '${currentUserId}' AND status = 'accepted')`) } },
            { id: { [Op.in]: sequelize.literal(`(SELECT senderId FROM MentorshipRequests WHERE receiverId = '${currentUserId}' AND status = 'accepted')`) } }
          ]
        });
      } else if (connectionStatus === 'pending') {
        where[Op.and].push({
          [Op.or]: [
            { id: { [Op.in]: sequelize.literal(`(SELECT receiverId FROM MentorshipRequests WHERE senderId = '${currentUserId}' AND status = 'pending')`) } },
            { id: { [Op.in]: sequelize.literal(`(SELECT senderId FROM MentorshipRequests WHERE receiverId = '${currentUserId}' AND status = 'pending')`) } }
          ]
        });
      } else if (connectionStatus === 'not_connected') {
        // Exclude anyone with an active (accepted or pending) relationship
        where[Op.and].push({
          id: {
            [Op.and]: [
              { [Op.notIn]: sequelize.literal(`(SELECT IF(senderId = '${currentUserId}', receiverId, senderId) FROM MentorshipRequests WHERE (senderId = '${currentUserId}' OR receiverId = '${currentUserId}') AND status IN ('accepted', 'pending'))`) }
            ]
          }
        });
      }
    }

    console.log("Generated WHERE clause:", JSON.stringify(where, null, 2));

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit,
      offset,
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
