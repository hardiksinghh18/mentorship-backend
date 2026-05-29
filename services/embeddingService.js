const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Synthesizes profile fields into a comprehensive semantic description
 * and generates its vector embedding using Gemini's text-embedding-004.
 */
exports.generateProfileEmbedding = async (user) => {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not defined in environment variables.");
    return null;
  }

  // Parse skills
  let skillsList = "";
  if (user.skills) {
    try {
      const parsed = typeof user.skills === 'string' ? JSON.parse(user.skills) : user.skills;
      if (Array.isArray(parsed)) {
        skillsList = parsed.join(', ');
      } else if (typeof parsed === 'object') {
        skillsList = Object.values(parsed).join(', ');
      } else {
        skillsList = String(parsed);
      }
    } catch {
      skillsList = String(user.skills);
    }
  }

  // Parse experience details
  let experienceList = "";
  if (user.experience) {
    try {
      const parsed = typeof user.experience === 'string' ? JSON.parse(user.experience) : user.experience;
      if (Array.isArray(parsed)) {
        experienceList = parsed
          .map(exp => `${exp.role || exp.title || ""} at ${exp.company || ""} (${exp.startDate || ""} to ${exp.currentlyWorking ? 'Present' : (exp.endDate || 'Present')})`)
          .join('; ');
      }
    } catch {
      experienceList = String(user.experience);
    }
  }

  // Build a highly rich and standardized context string to feed to the embedding model
  const profileText = `
    Role: ${user.role || 'Member'}
    Bio: ${user.bio || 'No bio provided'}
    Skills and Expertise: ${skillsList || 'None listed'}
    Professional History: ${experienceList || 'None listed'}
    Years of Experience: ${user.yearsOfExperience || 0}
  `.trim().replace(/\s+/g, ' ');

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(profileText);
    if (result && result.embedding && result.embedding.values) {
      return result.embedding.values;
    }
    return null;
  } catch (error) {
    console.error("Error generating Gemini embedding:", error.message);
    return null;
  }
};
