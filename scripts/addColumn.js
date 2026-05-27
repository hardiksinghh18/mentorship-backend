const sequelize = require('../config/db');

async function addColumn() {
  try {
    console.log('Attempting to add socialLinks column manually...');
    await sequelize.query('ALTER TABLE Users ADD COLUMN socialLinks JSON DEFAULT NULL AFTER experience');
    console.log('socialLinks column added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding column:', error.message);
    process.exit(1);
  }
}

addColumn();
