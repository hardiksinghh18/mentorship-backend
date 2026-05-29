const sequelize = require('../config/db');

async function addColumn() {
  try {
    console.log('Attempting to add profileEmbedding column manually to Clever Cloud MySQL...');
    await sequelize.query('ALTER TABLE Users ADD COLUMN profileEmbedding LONGTEXT DEFAULT NULL AFTER yearsOfExperience');
    console.log('profileEmbedding column added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding column:', error.message);
    process.exit(1);
  }
}

addColumn();
