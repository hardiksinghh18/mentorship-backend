const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const accessCookieOptions = {
  maxAge: 24 * 60 * 60 * 1000, // 1 day
  path: "/",
  httpOnly: true,
  secure: isProduction, // true for HTTPS in production
  sameSite: isProduction ? 'None' : 'Lax', // 'None' for cross-site cookies, 'Lax' for development
};

const verifyTokens = (req, res) => {
  try {
   
    const accessToken = req.cookies.accessToken;
   
    if (!accessToken) {
      if (renewToken(req, res)) {
        return res.json({ loggedIn: true, message: 'Token renewed successfully' });
      } else {
        return res.status(401).json({ loggedIn: false, message: 'No valid tokens found' });
      }
    }

    jwt.verify(accessToken, process.env.ACCESS_TOKEN_KEY,async (err, decoded) => {
      if (err) {
        return res.status(401).json({ loggedIn: false, message: 'Invalid Access Token' });
      }
      console.log(decoded.email)
      const user = await User.findOne({ where: { email:decoded.email } });
      
      return res.json({ loggedIn: true, user: user.dataValues, message: 'Access Token valid' });
    });
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ loggedIn: false, message: 'Server error' });
  }
};

const renewToken = (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return false;

    let renewed = false;
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY, (err, decoded) => {
      if (!err) {
    
        const accessToken = jwt.sign({ email: decoded.email }, process.env.ACCESS_TOKEN_KEY, { expiresIn: '1d' });
        res.cookie('accessToken', accessToken,accessCookieOptions);
        renewed = true;
      }
    });
    return renewed;
  } catch (error) {
    console.error('Error renewing token:', error);
    return false;
  }
};

module.exports = verifyTokens;
