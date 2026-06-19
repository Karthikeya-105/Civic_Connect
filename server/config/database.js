const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// SSL configuration for cloud MySQL providers (Aiven, PlanetScale, etc.)
const dialectOptions = process.env.DB_SSL === 'true'
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {};

const sequelize = new Sequelize(
    process.env.DB_NAME || 'civic_dashboard',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        dialect: 'mysql',
        dialectOptions,
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 10,
            min: 0,
            acquire: 60000,
            idle: 10000
        }
    }
);

module.exports = sequelize;
