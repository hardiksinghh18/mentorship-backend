const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const sequelize = require('../config/db');

const setupVector = async () => {
  try {
    console.log("Connecting to Supabase PostgreSQL database...");
    await sequelize.authenticate();
    console.log("Database connected successfully.");

    console.log("Enabling pgvector extension...");
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log("pgvector extension enabled successfully.");

    console.log("Altering profileEmbedding column type in Users table to vector(3072)...");
    
    // We check if table column alteration is required
    // If table doesn't exist, Sequelize sync will create it anyway with the correct type.
    // If it exists, we alter its type.
    await sequelize.query(`
      ALTER TABLE "Users" 
      ALTER COLUMN "profileEmbedding" TYPE vector(3072) 
      USING "profileEmbedding"::vector(3072);
    `);
    
    console.log("profileEmbedding column altered to vector(3072) successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to setup pgvector in database:", error);
    process.exit(1);
  }
};

setupVector();
