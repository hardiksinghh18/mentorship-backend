const bcrypt = require('bcryptjs');
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

const refreshCookieOptions = {
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: "/",
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'None' : 'Lax',
};

 

 exports.register = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Check if the email or username already exists
    const existingUserByEmail = await User.findOne({ where: { email } });
    const existingUserByUsername = await User.findOne({ where: { username } });

    if (existingUserByEmail) {
      return res.status(400).json({ message: 'Email is already taken' });
    }

    if (existingUserByUsername) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = await User.create({
      email,
      username,
      password: hashedPassword,
    });

    // Create access and refresh tokens
    const accessToken = jwt.sign({ userId: newUser.id, email: newUser.email, username: newUser.username }, process.env.ACCESS_TOKEN_KEY, { expiresIn: '1d' });
    const refreshToken = jwt.sign({ userId: newUser.id, email: newUser.email }, process.env.REFRESH_TOKEN_KEY, { expiresIn: '30d' });

    console.log('Access Token:', accessToken);
    console.log('Refresh Token:', refreshToken);

    // Send success response with cookies

     res
     .status(200)
      .cookie('accessToken', accessToken, accessCookieOptions)
      .cookie('refreshToken', refreshToken, refreshCookieOptions)
      .json({  loggedIn: true, user: newUser,message: 'Regisration successful'});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
};



// User Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by username
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create access and refresh tokens
    const accessToken = jwt.sign({ userId: user.id, email: user.email, username: user.username }, process.env.ACCESS_TOKEN_KEY, { expiresIn: '1d' });
    const refreshToken = jwt.sign({ userId: user.id, email: user.email }, process.env.REFRESH_TOKEN_KEY, { expiresIn: '30d' });

    // Send tokens in cookies
    res
    .status(200)
      .cookie('accessToken', accessToken, accessCookieOptions)
      .cookie('refreshToken', refreshToken, refreshCookieOptions)
      .json({  loggedIn: true, user: user,message: 'Login successful'});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

