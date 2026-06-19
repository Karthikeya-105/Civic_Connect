const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VoucherClaim = sequelize.define('VoucherClaim', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    voucherId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    claimedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = VoucherClaim;
