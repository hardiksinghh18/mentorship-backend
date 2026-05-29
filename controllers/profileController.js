const User = require('../models/User');
const embeddingService = require('../services/embeddingService');

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



    // Calculate total years of experience
    let totalYears = 0;
    const expData = req.body.experience || user.experience;
    const parsedExp = typeof expData === 'string' ? JSON.parse(expData) : expData;

    if (parsedExp && Array.isArray(parsedExp)) {
      parsedExp.forEach(exp => {
        if (exp.startDate) {
          const start = new Date(exp.startDate);
          const end = exp.currentlyWorking ? new Date() : (exp.endDate ? new Date(exp.endDate) : new Date());
          const diffInYears = (end - start) / (1000 * 60 * 60 * 24 * 365.25);
          if (diffInYears > 0) totalYears += diffInYears;
        }
      });
    }

    // Update the user with the new values
    const updatedData = {
      fullName: req.body.fullName || user.fullName,
      role: req.body.role || user.role,
      skills: req.body.skills || user.skills,
      bio: req.body.bio || user.bio,
      education: req.body.education || user.education,
      experience: req.body.experience || user.experience,
      socialLinks: req.body.socialLinks || user.socialLinks,
      yearsOfExperience: Math.floor(totalYears)
    };

    // Recalculate and cache the profile embedding
    let profileEmbedding = user.profileEmbedding;
    try {
      const embeddingValues = await embeddingService.generateProfileEmbedding({
        role: updatedData.role,
        bio: updatedData.bio,
        skills: updatedData.skills,
        experience: updatedData.experience,
        yearsOfExperience: updatedData.yearsOfExperience
      });
      if (embeddingValues) {
        profileEmbedding = JSON.stringify(embeddingValues);
      }
    } catch (embError) {
      console.error("Failed to generate profile embedding on update:", embError.message);
    }

    updatedData.profileEmbedding = profileEmbedding;

    // Update the user in the database
    const updatedUser = await user.update(updatedData);

    res.json({ loggedIn: true, user: updatedUser, message: 'Profile updated successfully' });
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


