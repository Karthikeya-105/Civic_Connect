const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/auth');

const isDBConnected = () => mongoose.connection.readyState === 1;

// Middleware: admin only
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'dept_admin') {
        return res.status(403).json({ message: 'Admin or Dept Admin only' });
    }
    next();
};

// Demo data used when MongoDB is not connected
const DEMO_ADMIN_STATS = {
    overview: { total: 248, resolved: 186, inProgress: 34, submitted: 28, totalUsers: 1240, resolutionRate: 75 },
    byCategory: [
        { _id: 'garbage', count: 78 }, { _id: 'roads', count: 62 }, { _id: 'water', count: 41 },
        { _id: 'lighting', count: 29 }, { _id: 'electricity', count: 18 }, { _id: 'drainage', count: 15 }, { _id: 'other', count: 5 }
    ],
    bySeverity: [{ _id: 'high', count: 89 }, { _id: 'medium', count: 112 }, { _id: 'low', count: 47 }],
    monthly: [
        { _id: { month: 10, year: 2025 }, count: 32, resolved: 28 },
        { _id: { month: 11, year: 2025 }, count: 41, resolved: 35 },
        { _id: { month: 12, year: 2025 }, count: 38, resolved: 30 },
        { _id: { month: 1, year: 2026 }, count: 52, resolved: 44 },
        { _id: { month: 2, year: 2026 }, count: 47, resolved: 39 },
        { _id: { month: 3, year: 2026 }, count: 38, resolved: 10 },
    ],
    byDept: [
        { _id: 'Sanitation Department', total: 78, resolved: 62 },
        { _id: 'Public Works Department', total: 62, resolved: 48 },
        { _id: 'Water Supply Board', total: 41, resolved: 38 },
        { _id: 'Electricity Department', total: 47, resolved: 30 },
        { _id: 'Municipal Corporation', total: 20, resolved: 8 },
    ],
    hotspots: [
        { _id: 'h1', title: 'Overflowing Garbage Bins in Sector 12', category: 'garbage', upvoteCount: 47, severity: 'high' },
        { _id: 'h2', title: 'Open Manhole on Brigade Road', category: 'drainage', upvoteCount: 65, severity: 'critical' },
        { _id: 'h3', title: 'Large Pothole on MG Road', category: 'roads', upvoteCount: 24, severity: 'high' },
    ]
};

const DEMO_ADMIN_ISSUES = [
    { _id: 'demo_i1', title: 'Large Pothole on MG Road', category: 'roads', severity: 'high', status: 'progress', location: { address: 'MG Road, New Delhi' }, reportedBy: { name: 'Priya Sharma', email: 'priya@demo.com' }, assignedDept: 'Public Works Department', upvoteCount: 24, createdAt: new Date(Date.now() - 5 * 86400000) },
    { _id: 'demo_i2', title: 'Overflowing Garbage Bins in Sector 12', category: 'garbage', severity: 'high', status: 'submitted', location: { address: 'Sector 12, Rohini, Delhi' }, reportedBy: { name: 'Amit Kumar', email: 'amit@demo.com' }, assignedDept: 'Sanitation Department', upvoteCount: 47, createdAt: new Date(Date.now() - 2 * 86400000) },
    { _id: 'demo_i3', title: 'Street Light Not Working Near Park', category: 'lighting', severity: 'medium', status: 'assigned', location: { address: 'Cubbon Park, Bengaluru' }, reportedBy: { name: 'Lakshmi Rao', email: 'lakshmi@demo.com' }, assignedDept: 'Electricity Department', upvoteCount: 18, createdAt: new Date(Date.now() - 10 * 86400000) },
    { _id: 'demo_i4', title: 'Water Pipeline Leakage on Station Road', category: 'water', severity: 'critical', status: 'resolved', location: { address: 'Station Road, Mumbai' }, reportedBy: { name: 'Rahul Singh', email: 'rahul@demo.com' }, assignedDept: 'Water Supply Board', upvoteCount: 92, createdAt: new Date(Date.now() - 15 * 86400000) },
    { _id: 'demo_i5', title: 'Open Manhole on Brigade Road', category: 'drainage', severity: 'critical', status: 'verified', location: { address: 'Brigade Road, Bengaluru' }, reportedBy: { name: 'Sneha Patel', email: 'sneha@demo.com' }, assignedDept: 'Drainage & Infrastructure', upvoteCount: 65, createdAt: new Date(Date.now() - 86400000) },
];

const DEMO_USERS_LIST = [
    { _id: 'u1', name: 'Priya Sharma', email: 'priya@demo.com', role: 'citizen', points: 340, level: 'Community Guardian', reportCount: 22, badges: [{ name: 'Eco Warrior', icon: '🌍' }] },
    { _id: 'u2', name: 'Amit Kumar', email: 'amit@demo.com', role: 'citizen', points: 280, level: 'Community Guardian', reportCount: 18, badges: [{ name: 'Pothole Hunter', icon: '🕵️' }] },
    { _id: 'u3', name: 'Rahul Singh', email: 'rahul@demo.com', role: 'citizen', points: 520, level: 'Civic Champion', reportCount: 35, badges: [{ name: 'Civic Champion', icon: '🏆' }] },
    { _id: 'u4', name: 'Lakshmi Rao', email: 'lakshmi@demo.com', role: 'citizen', points: 195, level: 'Civic Volunteer', reportCount: 12, badges: [] },
    { _id: 'u5', name: 'Sneha Patel', email: 'sneha@demo.com', role: 'citizen', points: 410, level: 'Eco Warrior', reportCount: 28, badges: [{ name: 'Swadeshi Star', icon: '🇮🇳' }] },
];

// GET /api/admin/stats - full analytics data
router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
    try {
        if (!isDBConnected()) return res.json(DEMO_ADMIN_STATS);
        const Issue = require('../models/Issue');
        const User = require('../models/User');
        const baseFilter = req.user.role === 'dept_admin' && req.user.department ? { assignedDept: req.user.department } : {};

        const total = await Issue.countDocuments(baseFilter);
        const resolved = await Issue.countDocuments({ ...baseFilter, status: 'resolved' });
        const inProgress = await Issue.countDocuments({ ...baseFilter, status: 'progress' });
        const submitted = await Issue.countDocuments({ ...baseFilter, status: 'submitted' });
        const totalUsers = await User.countDocuments({ role: 'citizen' });

        // Issues by category
        const byCategory = await Issue.aggregate([
            { $match: baseFilter },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        // Issues by severity
        const bySeverity = await Issue.aggregate([
            { $match: baseFilter },
            { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]);

        // Issues by status
        const byStatus = await Issue.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Monthly trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const monthly = await Issue.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    count: { $sum: 1 },
                    resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Department stats
        const byDept = await Issue.aggregate([
            {
                $group: {
                    _id: '$assignedDept',
                    total: { $sum: 1 },
                    resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
                }
            }
        ]);

        // Top locations (upvoted)
        const hotspots = await Issue.find({ status: { $ne: 'resolved' } })
            .sort('-upvoteCount')
            .limit(5)
            .select('title location upvoteCount category severity');

        res.json({
            overview: { total, resolved, inProgress, submitted, totalUsers, resolutionRate: Math.round((resolved / total) * 100) || 0 },
            byCategory, bySeverity, byStatus, monthly, byDept, hotspots
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/issues - paginated with all filters
router.get('/issues', authMiddleware, adminOnly, async (req, res) => {
    try {
        if (!isDBConnected()) {
            let result = [...DEMO_ADMIN_ISSUES];
            const { status, category, search } = req.query;
            if (status && status !== 'all') result = result.filter(i => i.status === status);
            if (category && category !== 'all') result = result.filter(i => i.category === category);
            if (search) result = result.filter(i => i.title.toLowerCase().includes(search.toLowerCase()));
            return res.json({ issues: result, total: result.length, pages: 1 });
        }
        const Issue = require('../models/Issue');
        const { category, status, severity, search, sort = '-createdAt', page = 1, limit = 20 } = req.query;
        const filter = {};

        // Filter by dept for dept_admins
        if (req.user.role === 'dept_admin' && req.user.department) {
            filter.assignedDept = req.user.department;
        }

        if (category && category !== 'all') filter.category = category;
        if (status && status !== 'all') filter.status = status;
        if (severity && severity !== 'all') filter.severity = severity;
        if (search) filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];

        const issues = await Issue.find(filter)
            .populate('reportedBy', 'name email')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Issue.countDocuments(filter);
        res.json({ issues, total, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/users - user list
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
    try {
        if (!isDBConnected()) return res.json(DEMO_USERS_LIST);
        const User = require('../models/User');
        const users = await User.find({ role: 'citizen' })
            .select('-password')
            .sort('-points')
            .limit(50);
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
