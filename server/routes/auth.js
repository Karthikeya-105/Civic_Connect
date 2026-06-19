const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const { User, UserBadge, Notification, sequelize } = require('../models');

// Generate JWT
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, department: user.department || '' },
        process.env.JWT_SECRET || 'civicconnect_secret_token_123',
        { expiresIn: '7d' }
    );
};

// ─── DEMO USERS (work without Database) ───────────────────────────────────────
const DEMO_USERS = {
    'citizen@demo.com': {
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
    'sanitation@admin.com': {
        id: 'demo_dept_001',
        name: 'Suresh Gupta (Sanitation Admin)',
        email: 'sanitation@admin.com', password: 'dept123',
        role: 'dept_admin', department: 'Sanitation Department',
        points: 0, level: 'Dept Admin', reportCount: 0, resolvedCount: 0,
        badges: [{ name: 'Dept Admin', icon: '🏢' }], avatar: ''
    },
    'roads@admin.com': {
        id: 'demo_dept_002',
        name: 'Amit Verma (Roads Admin)',
        email: 'roads@admin.com', password: 'dept123',
        role: 'dept_admin', department: 'Public Works Department',
        points: 0, level: 'Dept Admin', reportCount: 0, resolvedCount: 0,
        badges: [{ name: 'Dept Admin', icon: '🏢' }], avatar: ''
    },
    'water@admin.com': {
        id: 'demo_dept_003',
        name: 'Priya Nair (Water Admin)',
        email: 'water@admin.com', password: 'dept123',
        role: 'dept_admin', department: 'Water Supply Board',
        points: 0, level: 'Dept Admin', reportCount: 0, resolvedCount: 0,
        badges: [{ name: 'Dept Admin', icon: '🏢' }], avatar: ''
    },
    'electricity@admin.com': {
        id: 'demo_dept_004',
        name: 'Rajan Sharma (Electricity Admin)',
        email: 'electricity@admin.com', password: 'dept123',
        role: 'dept_admin', department: 'Electricity Department',
        points: 0, level: 'Dept Admin', reportCount: 0, resolvedCount: 0,
        badges: [{ name: 'Dept Admin', icon: '🏢' }], avatar: ''
    },
    'drainage@admin.com': {
        id: 'demo_dept_005',
        name: 'Lakshmi Iyer (Drainage Admin)',
        email: 'drainage@admin.com', password: 'dept123',
        role: 'dept_admin', department: 'Drainage & Infrastructure',
        points: 0, level: 'Dept Admin', reportCount: 0, resolvedCount: 0,
        badges: [{ name: 'Dept Admin', icon: '🏢' }], avatar: ''
    },
};

// Check if we should use SQL or allow Demo fallback
const useDB = () => {
    return !!process.env.DB_HOST;
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
            const existing = await User.findOne({ where: { email } }).catch(() => null);
            if (existing) return res.status(409).json({ message: 'Email already registered' });

            const user = await User.create({
                name,
                email,
                password,
                phone: phone || '',
                points: 10,
                level: 'Civic Newcomer'
            });
            user.updateLevel();
            await user.save();

            const badge = await UserBadge.create({
                userId: user.id,
                name: 'Early Adopter',
                icon: '🌟'
            });

            await Notification.create({
                userId: user.id,
                title: 'Welcome to CivicConnect!',
                message: 'Start reporting issues to earn points!',
                type: 'system'
            });

            const token = generateToken(user);
            return res.status(201).json({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    points: user.points,
                    level: user.level,
                    badges: [badge],
                    avatar: user.avatar
                }
            });
        }

        // Demo mode (no DB)
        if (DEMO_USERS[email]) return res.status(409).json({ message: 'Email already registered' });
        const demoUser = {
            id: 'user_' + Date.now(),
            name, email, password, role: 'citizen',
            points: 10, level: 'Civic Newcomer', reportCount: 0, resolvedCount: 0,
            badges: [{ name: 'Early Adopter', icon: '🌟' }], avatar: '',
            treesSaved: 0, co2Reduced: 0, paperSaved: 0,
        };
        DEMO_USERS[email] = demoUser;
        const token = generateToken(demoUser);
        return res.status(201).json({ token, user: demoUser });

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
            let user = await User.findOne({
                where: { email },
                include: [{ model: UserBadge, as: 'badges' }]
            }).catch(() => null);

            // Auto-seed demo account if they use demo credentials on a fresh DB
            if (!user && DEMO_USERS[email] && DEMO_USERS[email].password === password) {
                const demo = DEMO_USERS[email];
                user = await User.create({
                    name: demo.name,
                    email: demo.email,
                    password: demo.password, // Hook hashes this automatically
                    role: demo.role,
                    points: demo.points
                });

                if (demo.badges && demo.badges.length > 0) {
                    for (const b of demo.badges) {
                        await UserBadge.create({
                            userId: user.id,
                            name: b.name,
                            icon: b.icon
                        });
                    }
                }

                // Reload user with badges
                user = await User.findByPk(user.id, {
                    include: [{ model: UserBadge, as: 'badges' }]
                });
            }

            if (!user) {
                // Fallback attempt to check demo account in memory
                const demoUser = DEMO_USERS[email];
                if (demoUser && demoUser.password === password) {
                    const token = generateToken(demoUser);
                    return res.json({ token, user: demoUser });
                }
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const isMatch = await user.comparePassword(password);
            if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

            await user.update({ lastLogin: new Date() }).catch(() => null);
            const token = generateToken(user);

            return res.json({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    points: user.points,
                    level: user.level,
                    badges: user.badges,
                    avatar: user.avatar,
                    reportCount: user.reportCount
                }
            });
        }

        // Demo mode fallback
        const demoUser = DEMO_USERS[email];
        if (!demoUser) return res.status(401).json({ message: 'Invalid credentials. Use demo accounts: citizen@demo.com / demo123 or admin@demo.com / admin123' });
        if (demoUser.password !== password) return res.status(401).json({ message: 'Invalid credentials' });

        const token = generateToken(demoUser);
        return res.json({ token, user: demoUser });

    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// ─── GET ME ──────────────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
    try {
        if (useDB()) {
            const user = await User.findByPk(req.user.id, {
                attributes: { exclude: ['password'] },
                include: [{ model: UserBadge, as: 'badges' }]
            }).catch(() => null);

            if (!user) {
                const demoUser = Object.values(DEMO_USERS).find(u => u.id === req.user.id || u.email === req.user.email);
                if (demoUser) return res.json(demoUser);
                return res.status(404).json({ message: 'User not found' });
            }
            return res.json(user);
        }
        // Demo mode
        const demoUser = Object.values(DEMO_USERS).find(u => u.id === req.user.id || u.email === req.user.email);
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
            await User.update(
                { name, phone, address },
                { where: { id: req.user.id } }
            );
            const user = await User.findByPk(req.user.id, {
                attributes: { exclude: ['password'] },
                include: [{ model: UserBadge, as: 'badges' }]
            });
            return res.json(user);
        }
        const demoUser = Object.values(DEMO_USERS).find(u => u.id === req.user.id || u.email === req.user.email);
        if (demoUser) {
            demoUser.name = name || demoUser.name;
        }
        res.json(demoUser || {});
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
