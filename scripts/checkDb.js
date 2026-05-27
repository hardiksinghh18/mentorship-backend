const sequelize = require('../config/db');
const User = require('../models/User');

async function checkTable() {
  try {
    const tableInfo = await sequelize.getQueryInterface().describeTable('Users');
    console.log('Columns in Users table:', Object.keys(tableInfo));
    process.exit(0);
  } catch (error) {
    console.error('Error checking table:', error);
    process.exit(1);
  }
}

checkTable();
