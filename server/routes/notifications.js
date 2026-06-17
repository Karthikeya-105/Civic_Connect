const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const mongoose = require('mongoose');

const isDBConnected = () => mongoose.connection.readyState === 1;

// Demo notifications for when DB is not connected
const DEMO_NOTIFS = {
    demo_citizen_001: [
        { _id: 'n1', title: 'Welcome to CivicConnect!', message: 'Start reporting issues to earn points!', type: 'system', read: false, createdAt: new Date() },
        { _id: 'n2', title: 'Issue Status Updated', message: 'Your pothole report is now In Progress!', type: 'status_update', read: false, createdAt: new Date(Date.now() - 3600000) },
    ],
};

// GET /api/notifications/mine
router.get('/mine', authMiddleware, async (req, res) => {
    try {
        if (isDBConnected()) {
            const Notification = require('../models/Notification');
            const notifications = await Notification.find({ user: req.user.id }).sort('-createdAt').limit(20);
            const unreadCount = await Notification.countDocuments({ user: req.user.id, read: false });
            return res.json({ notifications, unreadCount });
        }
        // Demo mode
        const notifs = DEMO_NOTIFS[req.user.id] || [];
        return res.json({ notifications: notifs, unreadCount: notifs.filter(n => !n.read).length });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authMiddleware, async (req, res) => {
    try {
        if (isDBConnected()) {
            const Notification = require('../models/Notification');
            await Notification.findByIdAndUpdate(req.params.id, { read: true });
        } else {
            const notifs = DEMO_NOTIFS[req.user.id] || [];
            const n = notifs.find(x => x._id === req.params.id);
            if (n) n.read = true;
        }
        res.json({ message: 'Marked as read' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/notifications/read-all
router.put('/read-all', authMiddleware, async (req, res) => {
    try {
        if (isDBConnected()) {
            const Notification = require('../models/Notification');
            await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
        } else {
            (DEMO_NOTIFS[req.user.id] || []).forEach(n => n.read = true);
        }
        res.json({ message: 'All marked as read' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
