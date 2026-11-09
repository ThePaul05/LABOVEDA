const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(190), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  rol: {
    type: DataTypes.ENUM('agente', 'jefe'),
    allowNull: false,
    defaultValue: 'agente',
  },
}, {
  tableName: 'usuarios',
  timestamps: false,
});

module.exports = Usuario;
