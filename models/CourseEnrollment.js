const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Course = require('./Course');

const CourseEnrollment = sequelize.define('CourseEnrollment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'declined'),
    allowNull: false,
    defaultValue: 'pending',
  },
  completedModules: {
    type: DataTypes.JSON, // Array of completed module orderIndex numbers (e.g. [1, 2])
    allowNull: false,
    defaultValue: [],
  },
});

// Associations
User.hasMany(CourseEnrollment, { foreignKey: 'userId', as: 'enrollments' });
CourseEnrollment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Course.hasMany(CourseEnrollment, { foreignKey: 'courseId', as: 'enrollments', onDelete: 'CASCADE' });
CourseEnrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

module.exports = CourseEnrollment;
