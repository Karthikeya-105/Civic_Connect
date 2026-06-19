const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { Notification } = require('../models');

const isDBConnected = () => {
    return !!(process.env.DATABASE_URL || process.env.DB_HOST);
};

// Demo notifications for when DB is not connected
const DEMO_NOTIFS = {
    demo_citizen_001: [
        { id: 'n1', title: 'Welcome to CivicConnect!', message: 'Start reporting issues to earn points!', type: 'system', read: false, createdAt: new Date() },
        { id: 'n2', title: 'Issue Status Updated', message: 'Your pothole report is now In Progress!', type: 'status_update', read: false, createdAt: new Date(Date.now() - 3600000) },
    ],
};

// GET /api/notifications/mine
router.get('/mine', authMiddleware, async (req, res) => {
    try {
        if (isDBConnected()) {
            const notifications = await Notification.findAll({
                where: { userId: req.user.id },
                order: [['createdAt', 'DESC']],
                limit: 20
            });
            const unreadCount = await Notification.count({
                where: { userId: req.user.id, read: false }
            });
            return res.json({ notifications, unreadCount });
        }
        // Demo mode
        const notifs = DEMO_NOTIFS[req.user.id] || [];
        return res.json({ notifications: notifs, unreadCount: notifs.filter(n => !n.read).length });
    } catch (err) {
        console.error('Get notifications error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authMiddleware, async (req, res) => {
    try {
        if (isDBConnected()) {
            await Notification.update({ read: true }, { where: { id: req.params.id } });
        } else {
            const notifs = DEMO_NOTIFS[req.user.id] || [];
            const n = notifs.find(x => x.id === req.params.id);
            if (n) n.read = true;
        }
        res.json({ message: 'Marked as read' });
    } catch (err) {
        console.error('Read notification error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/notifications/read-all
router.put('/read-all', authMiddleware, async (req, res) => {
    try {
        if (isDBConnected()) {
            await Notification.update(
                { read: true },
                { where: { userId: req.user.id, read: false } }
            );
        } else {
            (DEMO_NOTIFS[req.user.id] || []).forEach(n => n.read = true);
        }
        res.json({ message: 'All marked as read' });
    } catch (err) {
        console.error('Read all notifications error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
