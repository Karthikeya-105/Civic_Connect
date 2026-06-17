const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/auth');

// Generate JWT
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id || user.id, email: user.email, role: user.role, department: user.department || '' },
        process.env.JWT_SECRET || 'civicconnect_secret_token_123',
        { expiresIn: '7d' }
    );
};

// ─── DEMO USERS (work without MongoDB) ───────────────────────────────────────
const DEMO_USERS = {
    'citizen@demo.com': {
        _id: 'demo_citizen_001',
        id: 'demo_citizen_001',
        name: 'Priya Sharma',
        email: 'citizen@demo.com',
        password: 'demo123',
        role: 'citizen',
        points: 120,
        level: 'Community Guardian',
        reportCount: 8,
        resolvedCount: 5,
        treesSaved: 0.16,
        co2Reduced: 4.0,
        paperSaved: 40,
        badges: [
            { name: 'Early Adopter', icon: '🌟' },
            { name: 'First Report', icon: '📝' },
            { name: 'Civic Volunteer', icon: '🌱' },
        ],
        avatar: '',
        upvotesGiven: 15,
    },
    'admin@demo.com': {
        _id: 'demo_admin_001',
        id: 'demo_admin_001',
        name: 'Rajesh Kumar (Admin)',
        email: 'admin@demo.com',
        password: 'admin123',
        role: 'admin',
        department: '',
        points: 500,
        level: 'Civic Champion',
        reportCount: 0,
        resolvedCount: 0,
        badges: [{ name: 'Civic Champion', icon: '🏆' }],
        avatar: '',
    },
    // Department Admin accounts
    'sanitation@admin.com': {
        _id: 'demo_dept_001', id: 'demo_dept_001',
        name: 'Suresh Gupta (Sanitation Admin)',
        email: 'sanitation@admin.com', password: 'dept123',
        role: 'dept_admin', department: 'Sanitation Department',
        points: 0, level: 'Dept Admin', reportCount: 0, resolvedCount: 0,
        badges: [{ name: 'Dept Admin', icon: '🏢' }], avatar: ''
    },
    'roads@admin.com': {
        _id: 'demo_dept_002', id: 'demo_dept_002',
        name: 'Amit Verma (Roads Admin)',
        email: 'roads@admin.com', password: 'dept123',
        role: 'dept_admin', department: 'Public Works Department',
        points: 0, level: 'Dept Admin', reportCount: 0, resolvedCount: 0,
        badges: [{ name: 'Dept Admin', icon: '🏢' }], avatar: ''
    },
    'water@admin.com': {
        _id: 'demo_dept_003', id: 'demo_dept_003',
        name: 'Priya Nair (Water Admin)',
        email: 'water@admin.com', password: 'dept123',
        role: 'dept_admin', department: 'Water Supply Board',
        points: 0, level: 'Dept Admin', reportCount: 0, resolvedCount: 0,
        badges: [{ name: 'Dept Admin', icon: '🏢' }], avatar: ''
    },
    'electricity@admin.com': {
        _id: 'demo_dept_004', id: 'demo_dept_004',
        name: 'Rajan Sharma (Electricity Admin)',
        email: 'electricity@admin.com', password: 'dept123',
        role: 'dept_admin', department: 'Electricity Department',
        points: 0, level: 'Dept Admin', reportCount: 0, resolvedCount: 0,
        badges: [{ name: 'Dept Admin', icon: '🏢' }], avatar: ''
    },
    'drainage@admin.com': {
        _id: 'demo_dept_005', id: 'demo_dept_005',
        name: 'Lakshmi Iyer (Drainage Admin)',
        email: 'drainage@admin.com', password: 'dept123',
        role: 'dept_admin', department: 'Drainage & Infrastructure',
        points: 0, level: 'Dept Admin', reportCount: 0, resolvedCount: 0,
        badges: [{ name: 'Dept Admin', icon: '🏢' }], avatar: ''
    },
};

// Utility to check if we should use DB or Demo
// Utility to check if we should strictly use DB or allow Demo fallback
const useDB = () => {
    const isUriSet = !!process.env.MONGO_URI;
    const isConnReady = mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2;
    return isUriSet || isConnReady;
};

// ─── SIGNUP ──────────────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ message: 'Name, email and password are required' });
        if (password.length < 6)
            return res.status(400).json({ message: 'Password must be at least 6 characters' });

        if (useDB()) {
            const User = require('../models/User');
            const Notification = require('../models/Notification');
            const existing = await User.findOne({ email }).catch(() => null);
            if (existing) return res.status(409).json({ message: 'Email already registered' });

            const user = new User({ name, email, password, phone: phone || '' });
            user.badges.push({ name: 'Early Adopter', icon: '🌟' });
            user.points += 10;
            user.updateLevel();
            await user.save();
            await Notification.create({ user: user._id, title: 'Welcome to CivicConnect!', message: 'Start reporting issues to earn points!', type: 'system' });

            const token = generateToken(user);
            return res.status(201).json({
                token,
                user: { id: user._id, name: user.name, email: user.email, role: user.role, points: user.points, level: user.level, badges: user.badges, avatar: user.avatar }
            });
        }

        // Demo mode (no DB): register in-memory for this session
        if (DEMO_USERS[email]) return res.status(409).json({ message: 'Email already registered' });
        const demoUser = {
            _id: 'user_' + Date.now(), id: 'user_' + Date.now(),
            name, email, password, role: 'citizen',
            points: 10, level: 'Civic Newcomer', reportCount: 0, resolvedCount: 0,
            badges: [{ name: 'Early Adopter', icon: '🌟' }], avatar: '',
            treesSaved: 0, co2Reduced: 0, paperSaved: 0,
        };
        DEMO_USERS[email] = demoUser;
        const token = generateToken(demoUser);
        return res.status(201).json({ token, user: { ...demoUser, id: demoUser._id } });

    } catch (err) {
        console.error('Signup error:', err.message);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: 'Email and password are required' });

        if (useDB()) {
            const User = require('../models/User');
            let user = await User.findOne({ email }).catch(() => null);

            // Auto-seed demo account if they use demo credentials on a fresh DB
            if (!user && DEMO_USERS[email] && DEMO_USERS[email].password === password) {
                const demo = DEMO_USERS[email];
                user = new User({
                    name: demo.name, email: demo.email, password: demo.password,
                    role: demo.role, points: demo.points, badges: demo.badges
                });
                await user.save().catch(err => {
                    console.error('Auto-seed save failed:', err);
                    return null;
                });
            }

            if (!user) {
                // Last ditch attempt: check if it's a demo account that we can use without seeding (safety)
                const demoUser = DEMO_USERS[email];
                if (demoUser && demoUser.password === password) {
                    const token = generateToken(demoUser);
                    return res.json({ token, user: { ...demoUser, id: demoUser._id } });
                }
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const isMatch = await user.comparePassword(password);
            if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
            await User.findByIdAndUpdate(user._id, { lastLogin: Date.now() }).catch(() => null);
            const token = generateToken(user);
            return res.json({
                token,
                user: { id: user._id, name: user.name, email: user.email, role: user.role, points: user.points, level: user.level, badges: user.badges, avatar: user.avatar, reportCount: user.reportCount }
            });
        }

        // Demo mode fallback
        const demoUser = DEMO_USERS[email];
        if (!demoUser) return res.status(401).json({ message: 'Invalid credentials. Use demo accounts: citizen@demo.com / demo123 or admin@demo.com / admin123' });
        if (demoUser.password !== password) return res.status(401).json({ message: 'Invalid credentials' });

        const token = generateToken(demoUser);
        return res.json({
            token,
            user: {
                id: demoUser._id, name: demoUser.name, email: demoUser.email,
                role: demoUser.role, points: demoUser.points, level: demoUser.level,
                badges: demoUser.badges, avatar: demoUser.avatar, reportCount: demoUser.reportCount || 0,
                treesSaved: demoUser.treesSaved || 0, co2Reduced: demoUser.co2Reduced || 0,
                paperSaved: demoUser.paperSaved || 0, resolvedCount: demoUser.resolvedCount || 0,
            }
        });

    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// ─── GET ME ──────────────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
    try {
        if (useDB()) {
            const User = require('../models/User');
            const user = await User.findById(req.user.id).select('-password').catch(() => null);
            if (!user) {
                // Might be a demo user ID even with DB connected
                const demoUser = Object.values(DEMO_USERS).find(u => u._id === req.user.id || u.email === req.user.email);
                if (demoUser) return res.json(demoUser);
                return res.status(404).json({ message: 'User not found' });
            }
            return res.json(user);
        }
        // Demo mode
        const demoUser = Object.values(DEMO_USERS).find(u => u._id === req.user.id || u.email === req.user.email);
        if (!demoUser) return res.status(404).json({ message: 'User not found' });
        res.json(demoUser);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── UPDATE PROFILE ──────────────────────────────────────────────────────────
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        if (useDB()) {
            const User = require('../models/User');
            const user = await User.findByIdAndUpdate(req.user.id, { name, phone, address }, { new: true, select: '-password' });
            return res.json(user);
        }
        const demoUser = Object.values(DEMO_USERS).find(u => u._id === req.user.id || u.email === req.user.email);
        if (demoUser) { demoUser.name = name || demoUser.name; }
        res.json(demoUser || {});
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
