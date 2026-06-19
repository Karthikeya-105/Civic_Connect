const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IssueUpvote = sequelize.define('IssueUpvote', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    issueId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = IssueUpvote;
