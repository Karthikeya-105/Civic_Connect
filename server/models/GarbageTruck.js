const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GarbageTruck = sequelize.define('GarbageTruck', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    vehicleId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    vehicleName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    driverName: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    driverPhone: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    department: {
        type: DataTypes.STRING,
        defaultValue: 'Sanitation Department'
    },
    area: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    lat: {
        type: DataTypes.DOUBLE,
        defaultValue: 12.9716
    },
    lng: {
        type: DataTypes.DOUBLE,
        defaultValue: 77.5946
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'active'
    },
    route: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    lastUpdated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    schedule: {
        type: DataTypes.STRING,
        defaultValue: ''
    }
});

module.exports = GarbageTruck;
