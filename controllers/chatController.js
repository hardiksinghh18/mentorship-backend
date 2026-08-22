const { Op } = require('sequelize');
const Message = require('../models/Message');

exports.sendMessage = async (req, res, next) => {
  try {
    const { senderId, receiverId, message } = req.body;
    
    const newMessage = await Message.create({ senderId, receiverId, message });
    
    res.status(201).json(newMessage);
  } catch (error) {
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const { senderId, receiverId } = req.params;

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }, // Reverse direction
        ],
      },
      order: [['createdAt', 'ASC']],
    });

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};
