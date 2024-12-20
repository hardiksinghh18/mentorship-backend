const User = require('../models/User');

// Get user profile by ID
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

 
// Update user profile
exports.updateProfile = async (req, res) => {
  try {


    // Find user by email (assuming req.params.id is the email)
    const user = await User.findOne({ where: { email: req.params.id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

  

    // Update the user with the new values
    const updatedData = {
      fullName: req.body.fullName || user.fullName, // If req.body.name is empty, keep the existing value
      role: req.body.role || user.role,
      skills: req.body.skills || user.skills,
      interests: req.body.interests || user.interests,
      bio: req.body.bio || user.bio,
    };

    // Update the user in the database
   const updatedUser= await user.update(updatedData);
 
    res.json({loggedIn: true,user: updatedUser, message: 'Profile updated successfully', user: updatedData });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};


// Delete user profile
exports.deleteProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    await user.destroy();
    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


