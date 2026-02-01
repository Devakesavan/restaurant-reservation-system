const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Restaurant = sequelize.define(
  'Restaurant',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    cuisine: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: null,
    },
    totalSeats: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: 'total_seats',
      validate: { min: 1 },
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
      field: 'owner_id',
    },
  },
  {
    tableName: 'restaurants',
    timestamps: true,
    underscored: true,
  }
);

module.exports = Restaurant;
