const sequelize = require('./config/db');
require('./models/User');
require('./models/MentorshipRequest');
require('./models/Message');
require('./models/Course');
require('./models/Module');
require('./models/CourseEnrollment');

sequelize.sync({ force: false }) // Set force: true to drop existing tables and recreate
  .then(() => {
    console.log('Database tables created successfully!');
  })
  .catch((err) => {
    console.error('Error creating tables:', err);
  });
