const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  fullName: { type: DataTypes.STRING, allowNull: true, unique: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('mentor', 'mentee'), allowNull: true },
  skills: { type: DataTypes.JSON },
  interests: { type: DataTypes.JSON },
  bio: { type: DataTypes.STRING }, 
});

module.exports = User;
 