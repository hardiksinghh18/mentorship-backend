const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const requireAuth = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    jwt.verify(accessToken, process.env.ACCESS_TOKEN_KEY, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid or expired access token' });
      }

      const user = await User.findOne({ where: { email: decoded.email } });
      if (!user) {
        return res.status(401).json({ message: 'User session not found' });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Error inside requireAuth middleware:', error);
    res.status(500).json({ message: 'Server authentication error' });
  }
};

module.exports = requireAuth;
