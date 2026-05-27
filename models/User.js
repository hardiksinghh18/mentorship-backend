const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  fullName: { type: DataTypes.STRING, allowNull: true, unique: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: true }, // Optional for Google Login
  googleId: { type: DataTypes.STRING, allowNull: true, unique: true },
  role: { type: DataTypes.ENUM('mentor', 'mentee'), allowNull: true },
  skills: { type: DataTypes.JSON },
  bio: { type: DataTypes.STRING },
  education: { type: DataTypes.JSON },
  experience: { type: DataTypes.JSON },
  socialLinks: { type: DataTypes.JSON },
  yearsOfExperience: { type: DataTypes.INTEGER, defaultValue: 0 },
});


module.exports = User;
