const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'citizen'
    },
    department: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    avatar: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    phone: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    whatsapp: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    address: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    points: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    level: {
        type: DataTypes.STRING,
        defaultValue: 'Civic Newcomer'
    },
    reportCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    resolvedCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    upvotesGiven: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    treesSaved: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0
    },
    co2Reduced: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0
    },
    paperSaved: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    notifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    notifyWhatsapp: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    notifyEmail: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    language: {
        type: DataTypes.STRING,
        defaultValue: 'en'
    },
    lastLogin: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    hooks: {
        beforeSave: async (user) => {
            if (user.changed('password')) {
                user.password = await bcrypt.hash(user.password, 12);
            }
        }
    }
});

User.prototype.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.updateLevel = function () {
    if (this.points >= 500) this.level = 'Civic Champion';
    else if (this.points >= 200) this.level = 'Eco Warrior';
    else if (this.points >= 100) this.level = 'Community Guardian';
    else if (this.points >= 50) this.level = 'Civic Volunteer';
    else this.level = 'Civic Newcomer';
};

module.exports = User;
