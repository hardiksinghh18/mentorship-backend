
const isProduction = process.env.NODE_ENV === 'production';

const accessCookieOptions = {
  // maxAge: 24 * 60 * 60 * 1000, // 1 day
  path: "/",
  httpOnly: true,
  secure: isProduction, // true for HTTPS in production
  sameSite: isProduction ? 'None' : 'Lax', // 'None' for cross-site cookies, 'Lax' for development
};

const refreshCookieOptions = {
  // maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: "/",
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'None' : 'Lax',
};
const logout = (req, res) => {
  try {
    res.clearCookie('accessToken', accessCookieOptions);
    res.clearCookie('refreshToken',refreshCookieOptions );

    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};



  module.exports=logout