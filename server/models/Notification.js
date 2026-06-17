const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['status_update', 'new_nearby', 'upvote', 'comment', 'award', 'system'], default: 'system' },
    relatedIssue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', default: null },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);
