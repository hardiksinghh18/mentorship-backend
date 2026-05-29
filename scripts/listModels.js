/* global fetch */
require('dotenv').config();


async function run() {
  try {
    console.log("Fetching available models...");
    // The standard way to list models in the Node SDK is:
    // we can request listModels if it exists, or just catch what's supported.
    // Let's call the listModels method.
    // Note: The GoogleGenerativeAI client does not have listModels directly in some older versions.
    // In newer versions, it is standard or we can fetch it via fetch.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    console.log("Supported Models:");
    if (data.models) {
      const embeddingModels = data.models.filter(m => m.supportedGenerationMethods.includes("embedContent"));
      embeddingModels.forEach(m => {
        console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(', ')})`);
      });
    } else {
      console.log("No models returned or invalid API key configuration:", data);
    }
    process.exit(0);
  } catch (error) {
    console.error("Error listing models:", error);
    process.exit(1);
  }
}

run();
