const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'la_boveda',
  process.env.MYSQL_USER || 'boveda_app',
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    dialect: 'mysql',
    logging: false,
    define: { timestamps: false },
    pool: { max: 5, min: 0, acquire: 15000, idle: 10000 },
  },
);

module.exports = { sequelize };
