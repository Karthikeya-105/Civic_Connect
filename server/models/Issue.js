const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Issue = sequelize.define('Issue', {
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
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    severity: {
        type: DataTypes.STRING,
        defaultValue: 'medium'
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'submitted'
    },
    locationLat: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    locationLng: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    locationAddress: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    locationWard: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    locationDistrict: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    images: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    resolvedImage: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    audio: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    reportedById: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    assignedTo: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    assignedDept: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    upvoteCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    aiCategory: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    aiConfidence: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0
    },
    aiSeverity: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    isDuplicate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    duplicateOfId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    pointsAwarded: {
        type: DataTypes.INTEGER,
        defaultValue: 15
    },
    verifiedByCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    resolutionVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    estimatedResolution: {
        type: DataTypes.DATE,
        allowNull: true
    },
    resolvedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
});

module.exports = Issue;
