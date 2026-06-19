const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CommentLike = sequelize.define('CommentLike', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    commentId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = CommentLike;
