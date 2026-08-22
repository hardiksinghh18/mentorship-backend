const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

exports.register = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    // Check if the email or username already exists
    const existingUserByEmail = await User.findOne({ where: { email } });
    const existingUserByUsername = await User.findOne({ where: { username } });

    if (existingUserByEmail) {
      const error = new Error('Email is already taken');
      error.statusCode = 400;
      throw error;
    }

    if (existingUserByUsername) {
      const error = new Error('Username is already taken');
      error.statusCode = 400;
      throw error;
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

    // Send success response with cookies
    const userResponse = newUser.toJSON();
    delete userResponse.password;

    res
      .status(200)
      .cookie('accessToken', accessToken, accessCookieOptions)
      .cookie('refreshToken', refreshToken, refreshCookieOptions)
      .json({ loggedIn: true, user: userResponse, message: 'Registration successful' });
  } catch (error) {
    next(error);
  }
};

// User Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    // Safety check: ensure user exists and has a password (not a Google-only user)
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    // Create access and refresh tokens
    const accessToken = jwt.sign({ userId: user.id, email: user.email, username: user.username }, process.env.ACCESS_TOKEN_KEY, { expiresIn: '1d' });
    const refreshToken = jwt.sign({ userId: user.id, email: user.email }, process.env.REFRESH_TOKEN_KEY, { expiresIn: '30d' });

    // Send tokens in cookies
    const userResponse = user.toJSON();
    delete userResponse.password;

    res
      .status(200)
      .cookie('accessToken', accessToken, accessCookieOptions)
      .cookie('refreshToken', refreshToken, refreshCookieOptions)
      .json({ loggedIn: true, user: userResponse, message: 'Login successful' });
  } catch (error) {
    next(error);
  }
};

// Google Single Sign-On / Login
exports.googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Create a new user if one doesn't exist
      const baseUsername = name ? name.toLowerCase().replace(/\s/g, '') : email.split('@')[0];
      let username = baseUsername;
      let counter = 1;
      
      while (await User.findOne({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await User.create({
        email,
        username,
        fullName: name,
        googleId,
      });
    } else if (!user.googleId) {
      // Update existing user with googleId if they login with Google for the first time
      user.googleId = googleId;
      await user.save();
    }

    // Create access and refresh tokens
    const accessToken = jwt.sign({ userId: user.id, email: user.email, username: user.username }, process.env.ACCESS_TOKEN_KEY, { expiresIn: '1d' });
    const refreshToken = jwt.sign({ userId: user.id, email: user.email }, process.env.REFRESH_TOKEN_KEY, { expiresIn: '30d' });

    const userResponse = user.toJSON();
    delete userResponse.password;

    res
      .status(200)
      .cookie('accessToken', accessToken, accessCookieOptions)
      .cookie('refreshToken', refreshToken, refreshCookieOptions)
      .json({ loggedIn: true, user: userResponse, message: 'Google login successful' });

  } catch (error) {
    next(error);
  }
};
