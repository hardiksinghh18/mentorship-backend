const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const MentorshipRequest = sequelize.define('MentorshipRequest', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  status: { type: DataTypes.ENUM('pending', 'accepted', 'declined'), defaultValue: 'pending' },
});

User.hasMany(MentorshipRequest, { foreignKey: 'senderId', as: 'sentRequests' });
User.hasMany(MentorshipRequest, { foreignKey: 'receiverId', as: 'receivedRequests' });
MentorshipRequest.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
MentorshipRequest.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

module.exports = MentorshipRequest;
