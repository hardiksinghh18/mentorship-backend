const User = require('../models/User');
const embeddingService = require('../services/embeddingService');

// Get user profile by ID
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};


// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    // Find user by email (assuming req.params.id is the email)
    const user = await User.findOne({ where: { email: req.params.id } });
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
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
    next(error);
  }
};


// Delete user profile
exports.deleteProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    await user.destroy();
    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    next(error);
  }
};
