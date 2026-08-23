const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Course = require('./Course');

const Module = sequelize.define('Module', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  resources: {
    type: DataTypes.JSON, // Array of { title: string, url: string } resource objects
    allowNull: false,
    defaultValue: [],
  },
  meetingLink: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  meetingTime: {
    type: DataTypes.DATE, // UTC Date-time indicating when live checkin starts
    allowNull: true,
  },
});

// Associations
Course.hasMany(Module, { foreignKey: 'courseId', as: 'modules', onDelete: 'CASCADE' });
Module.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

module.exports = Module;
