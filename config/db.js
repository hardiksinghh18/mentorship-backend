const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME, 
  process.env.DB_USER, 
  process.env.DB_PASSWORD, 
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || 'postgres',
    dialectModule: require('pg'),
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      lookup: (hostname, options, callback) => {
        dns.lookup(hostname, { family: 4 }, callback);
      }
    },
    pool: {
      max: 2,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);
 
sequelize.authenticate()
  .then(() => console.log('Database connected...'))
  .catch((err) => console.error('Unable to connect to the database:', err));

module.exports = sequelize;
