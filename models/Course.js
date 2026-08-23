const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  skillsTargeted: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  durationValue: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  durationUnit: {
    type: DataTypes.ENUM('Days', 'Weeks', 'Months'),
    allowNull: false,
    defaultValue: 'Days',
  },
  maxStudents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 20,
  },
});

// Associations
User.hasMany(Course, { foreignKey: 'creatorId', as: 'createdCourses' });
Course.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

module.exports = Course;
