const User = require('../models/User');
const embeddingService = require('../services/embeddingService');

async function run() {
  try {
    console.log("Starting profile embedding population for existing database records...");
    const users = await User.findAll({
      where: {
        profileEmbedding: null
      }
    });

    console.log(`Found ${users.length} users with missing embeddings.`);

    for (const user of users) {
      if (!user.role || !user.bio) {
        console.log(`Skipping user ${user.username} (profile incomplete: needs role and bio).`);
        continue;
      }

      console.log(`Generating and caching vector embedding for ${user.username}...`);
      const embeddingValues = await embeddingService.generateProfileEmbedding(user);
      if (embeddingValues) {
        user.profileEmbedding = JSON.stringify(embeddingValues);
        await user.save();
        console.log(`Successfully saved vector embedding for ${user.username}!`);
      } else {
        console.log(`Failed to generate embedding for ${user.username}.`);
      }
      
      // Delay slightly to prevent rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log("Finished embedding population successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error during embedding population:", error);
    process.exit(1);
  }
}

run();
