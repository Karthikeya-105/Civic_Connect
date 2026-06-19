const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Voucher = sequelize.define('Voucher', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },
    pointsCost: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    discountValue: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    category: {
        type: DataTypes.STRING,
        defaultValue: 'general'
    },
    imageEmoji: {
        type: DataTypes.STRING,
        defaultValue: '🎟️'
    },
    totalStock: {
        type: DataTypes.INTEGER,
        defaultValue: 100
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    expiresAt: {
        type: DataTypes.DATE,
        defaultValue: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    },
    partner: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    termsConditions: {
        type: DataTypes.TEXT,
        defaultValue: 'Subject to availability. Cannot be combined with other offers.'
    }
});

module.exports = Voucher;
