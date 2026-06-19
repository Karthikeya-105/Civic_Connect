const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const { Issue, User, Notification, IssueTimeline, IssueUpvote, IssueVerification, sequelize } = require('../models');
const { notifyIssueUpdate, sendEmail } = require('../middleware/notify');

const useDB = () => {
    return !!process.env.DB_HOST;
};

const isValidId = (id) => {
    if (!useDB()) return true;
    return !isNaN(parseInt(id));
};

// ── Demo issues for no-DB mode ──────────────────────────────────────────────
const DEMO_ISSUES = [
    { id: 'demo_i1', title: 'Large Pothole on MG Road', description: 'Dangerous pothole causing accidents near the main junction. Cars are swerving dangerously.', category: 'roads', severity: 'high', status: 'progress', location: { lat: 28.6139, lng: 77.2090, address: 'MG Road, New Delhi' }, images: [], upvotes: [], upvoteCount: 24, assignedDept: 'Public Works Department', reportedBy: { name: 'Priya Sharma', level: 'Civic Volunteer' }, aiCategory: 'roads', aiConfidence: 95, timeline: [{ status: 'submitted', message: 'Issue submitted by citizen', timestamp: new Date(Date.now() - 5 * 86400000) }, { status: 'progress', message: 'Team dispatched for repair', timestamp: new Date(Date.now() - 86400000) }], createdAt: new Date(Date.now() - 5 * 86400000), estimatedResolution: new Date(Date.now() + 2 * 86400000) },
    { id: 'demo_i2', title: 'Overflowing Garbage Bins in Sector 12', description: 'Garbage bins have not been emptied for 5 days. Extremely foul smell and health hazard.', category: 'garbage', severity: 'high', status: 'submitted', location: { lat: 28.7041, lng: 77.1025, address: 'Sector 12, Rohini, Delhi' }, images: [], upvotes: [], upvoteCount: 47, assignedDept: 'Sanitation Department', reportedBy: { name: 'Amit Kumar', level: 'Eco Warrior' }, timeline: [{ status: 'submitted', message: 'Issue submitted', timestamp: new Date(Date.now() - 2 * 86400000) }], createdAt: new Date(Date.now() - 2 * 86400000) },
    { id: 'demo_i3', title: 'Street Light Not Working Near Park', description: 'Three streetlights near the children park are non-functional for 2 weeks. Safety risk at night.', category: 'lighting', severity: 'medium', status: 'assigned', location: { lat: 12.9716, lng: 77.5946, address: 'Cubbon Park, Bengaluru' }, images: [], upvotes: [], upvoteCount: 18, assignedDept: 'Electricity Department', reportedBy: { name: 'Lakshmi Rao', level: 'Community Guardian' }, timeline: [{ status: 'submitted', message: 'Submitted', timestamp: new Date(Date.now() - 10 * 86400000) }, { status: 'assigned', message: 'Assigned to Electricity Dept', timestamp: new Date(Date.now() - 3 * 86400000) }], createdAt: new Date(Date.now() - 10 * 86400000) },
    { id: 'demo_i4', title: 'Water Pipeline Leakage on Station Road', description: 'Major pipe burst causing water wastage and road damage. Affecting 200+ households.', category: 'water', severity: 'critical', status: 'resolved', location: { lat: 19.0760, lng: 72.8777, address: 'Station Road, Mumbai' }, images: [], resolvedImage: '', upvotes: [], upvoteCount: 92, assignedDept: 'Water Supply Board', reportedBy: { name: 'Rahul Singh', level: 'Civic Champion' }, timeline: [{ status: 'submitted', message: 'Submitted', timestamp: new Date(Date.now() - 15 * 86400000) }, { status: 'progress', message: 'Repair team on-site', timestamp: new Date(Date.now() - 12 * 86400000) }, { status: 'resolved', message: 'Pipeline repaired and tested', timestamp: new Date(Date.now() - 8 * 86400000) }], createdAt: new Date(Date.now() - 15 * 86400000), resolvedAt: new Date(Date.now() - 8 * 86400000) },
    { id: 'demo_i5', title: 'Open Manhole on Brigade Road', description: 'Uncovered manhole in busy pedestrian area. Already caused one injury. Immediate action needed.', category: 'drainage', severity: 'critical', status: 'verified', location: { lat: 12.9766, lng: 77.6031, address: 'Brigade Road, Bengaluru' }, images: [], upvotes: [], upvoteCount: 65, assignedDept: 'Drainage & Infrastructure', reportedBy: { name: 'Sneha Patel', level: 'Eco Warrior' }, timeline: [{ status: 'submitted', message: 'Submitted', timestamp: new Date(Date.now() - 1 * 86400000) }, { status: 'verified', message: 'Verified by admin', timestamp: new Date(Date.now() - 12 * 3600000) }], createdAt: new Date(Date.now() - 86400000) },
];

// Haversine formula for distance in km
function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Department auto-assignment
function getDepartment(category) {
    const deptMap = {
        garbage: 'Sanitation Department',
        roads: 'Public Works Department',
        water: 'Water Supply Board',
        sanitation: 'Sanitation Department',
        lighting: 'Electricity Department',
        electricity: 'Electricity Department',
        drainage: 'Drainage & Infrastructure',
        other: 'Municipal Corporation'
    };
    return deptMap[category] || 'Municipal Corporation';
}

// Helper to map Sequelize Issue to MongoDB Response Format
const mapIssueForResponse = async (issue) => {
    if (!issue) return null;
    const iJson = issue.toJSON ? issue.toJSON() : issue;
    
    // Nest location properties back to nested object
    iJson.location = {
        lat: iJson.locationLat,
        lng: iJson.locationLng,
        address: iJson.locationAddress || '',
        ward: iJson.locationWard || '',
        district: iJson.locationDistrict || ''
    };
    delete iJson.locationLat;
    delete iJson.locationLng;
    delete iJson.locationAddress;
    delete iJson.locationWard;
    delete iJson.locationDistrict;

    // Load upvotes array of user IDs
    if (useDB()) {
        const upvotes = await IssueUpvote.findAll({ where: { issueId: iJson.id } });
        iJson.upvotes = upvotes.map(u => u.userId.toString());

        const verifications = await IssueVerification.findAll({ where: { issueId: iJson.id } });
        iJson.resolutionVerifiedBy = verifications.map(v => v.userId.toString());
    } else {
        iJson.upvotes = iJson.upvotes || [];
        iJson.resolutionVerifiedBy = iJson.resolutionVerifiedBy || [];
    }

    return iJson;
};

// GET /api/issues - list with filtering, search, sorting
router.get('/', async (req, res) => {
    try {
        if (!useDB()) {
            let result = [...DEMO_ISSUES];
            const { category, status, severity, search } = req.query;
            if (category && category !== 'all') result = result.filter(i => i.category === category);
            if (status && status !== 'all') result = result.filter(i => i.status === status);
            if (severity && severity !== 'all') result = result.filter(i => i.severity === severity);
            if (search) result = result.filter(i => i.title.toLowerCase().includes(search.toLowerCase()));
            return res.json({ issues: result, total: result.length, pages: 1, page: 1 });
        }

        const { category, status, severity, search, sort = '-createdAt', page = 1, limit = 20 } = req.query;
        const filter = {};
        
        if (category && category !== 'all') filter.category = category;
        if (status && status !== 'all') filter.status = status;
        if (severity && severity !== 'all') filter.severity = severity;
        if (search) {
            filter[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        let order = [['createdAt', 'DESC']];
        if (sort) {
            const isDesc = sort.startsWith('-');
            const field = isDesc ? sort.substring(1) : sort;
            order = [[field, isDesc ? 'DESC' : 'ASC']];
        }

        const limitNum = parseInt(limit);
        const offset = (parseInt(page) - 1) * limitNum;

        const { rows: issues, count: total } = await Issue.findAndCountAll({
            where: filter,
            include: [{
                model: User,
                as: 'reportedBy',
                attributes: ['name', 'avatar', 'level']
            }],
            order,
            limit: limitNum,
            offset
        });

        const mappedIssues = await Promise.all(issues.map(mapIssueForResponse));

        res.json({ issues: mappedIssues, total, pages: Math.ceil(total / limitNum), page: parseInt(page) });
    } catch (err) {
        console.error('List issues error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/issues/stats - aggregated stats
router.get('/stats', async (req, res) => {
    try {
        if (!useDB()) {
            const cats = {};
            DEMO_ISSUES.forEach(i => { cats[i.category] = (cats[i.category] || 0) + 1; });
            return res.json({
                total: DEMO_ISSUES.length,
                resolved: DEMO_ISSUES.filter(i => i.status === 'resolved').length,
                inProgress: DEMO_ISSUES.filter(i => i.status === 'progress').length,
                submitted: DEMO_ISSUES.filter(i => i.status === 'submitted').length,
                resolutionRate: 20, avgResolutionDays: 3.2,
                byCategory: Object.entries(cats).map(([_id, count]) => ({ _id, count }))
            });
        }

        const total = await Issue.count();
        const resolved = await Issue.count({ where: { status: 'resolved' } });
        const inProgress = await Issue.count({ where: { status: 'progress' } });
        const submitted = await Issue.count({ where: { status: 'submitted' } });

        const byCatRaw = await Issue.findAll({
            attributes: [
                ['category', '_id'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['category'],
            raw: true
        });
        const byCategory = byCatRaw.map(x => ({ _id: x._id, count: parseInt(x.count) }));

        res.json({ total, resolved, inProgress, submitted, resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0, avgResolutionDays: 3.2, byCategory });
    } catch (err) {
        console.error('Issue stats error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/issues/nearby - duplicate detection
router.get('/nearby', async (req, res) => {
    try {
        if (!useDB()) return res.json({ count: 0, issues: [] });

        const { lat, lng, radius = 0.5, category } = req.query;
        if (!lat || !lng) return res.status(400).json({ message: 'lat and lng required' });

        const latNum = parseFloat(lat), lngNum = parseFloat(lng), radiusNum = parseFloat(radius);
        const latDelta = radiusNum / 111;
        const lngDelta = radiusNum / (111 * Math.cos(latNum * Math.PI / 180));

        const filter = {
            locationLat: { [Op.between]: [latNum - latDelta, latNum + latDelta] },
            locationLng: { [Op.between]: [lngNum - lngDelta, lngNum + lngDelta] },
            status: { [Op.ne]: 'resolved' }
        };
        if (category) filter.category = category;

        const nearby = await Issue.findAll({
            where: filter,
            include: [{ model: User, as: 'reportedBy', attributes: ['name'] }],
            limit: 10
        });

        const mappedNearby = await Promise.all(nearby.map(mapIssueForResponse));
        const filtered = mappedNearby.filter(issue => getDistance(latNum, lngNum, issue.location.lat, issue.location.lng) <= radiusNum);

        res.json({ count: filtered.length, issues: filtered });
    } catch (err) {
        console.error('Nearby issues error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/issues/:id
router.get('/:id', async (req, res) => {
    try {
        if (!useDB()) {
            const demo = DEMO_ISSUES.find(i => i.id === req.params.id);
            if (!demo) return res.status(404).json({ message: 'Issue not found' });
            return res.json(demo);
        }

        if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Invalid Issue ID format' });

        const issue = await Issue.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'reportedBy',
                    attributes: ['name', 'avatar', 'level', 'points']
                },
                {
                    model: IssueTimeline,
                    as: 'timeline',
                    include: [{
                        model: User,
                        as: 'updatedBy',
                        attributes: ['name']
                    }]
                }
            ],
            order: [[{ model: IssueTimeline, as: 'timeline' }, 'timestamp', 'ASC']]
        });

        if (!issue) return res.status(404).json({ message: 'Issue not found' });

        const mappedIssue = await mapIssueForResponse(issue);
        return res.json(mappedIssue);
    } catch (err) {
        console.error('Get issue by id error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/issues - create new issue
router.post('/', authMiddleware, upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'audio', maxCount: 1 }
]), async (req, res) => {
    try {
        const { title, description, category, severity, lat, lng, address, aiCategory, aiConfidence } = req.body;
        if (!title || !description || !category || !lat || !lng)
            return res.status(400).json({ message: 'Missing required fields' });

        const images = req.files?.images?.map(f => `/uploads/${f.filename}`) || [];
        const audio = req.files?.audio?.[0] ? `/uploads/${req.files.audio[0].filename}` : '';
        const resolutionDays = { garbage: 2, roads: 5, water: 3, sanitation: 2, lighting: 3, electricity: 2, drainage: 4, other: 5 };
        const days = resolutionDays[category] || 5;

        if (!useDB()) {
            // Demo mode: add to in-memory array
            const demoIssue = {
                id: 'issue_' + Date.now(), title, description, category, severity: severity || 'medium',
                status: 'submitted', location: { lat: parseFloat(lat), lng: parseFloat(lng), address: address || '' },
                images, audio, reportedBy: { id: req.user.id, name: req.user.name || 'You', level: 'Civic Newcomer' },
                assignedDept: getDepartment(category), aiCategory: aiCategory || '', aiConfidence: parseFloat(aiConfidence) || 0,
                upvotes: [], upvoteCount: 0, timeline: [{ status: 'submitted', message: 'Issue submitted by citizen', timestamp: new Date() }],
                estimatedResolution: new Date(Date.now() + days * 86400000), createdAt: new Date(), updatedAt: new Date()
            };
            DEMO_ISSUES.unshift(demoIssue);
            console.log(`[EMAIL/SMS MOCK] Admin notified of new issue: ${title}`);
            return res.status(201).json(demoIssue);
        }

        const issue = await Issue.create({
            title,
            description,
            category,
            severity: severity || 'medium',
            locationLat: parseFloat(lat),
            locationLng: parseFloat(lng),
            locationAddress: address || '',
            images,
            audio,
            reportedById: req.user.id,
            assignedDept: getDepartment(category),
            aiCategory: aiCategory || '',
            aiConfidence: parseFloat(aiConfidence) || 0,
            estimatedResolution: new Date(Date.now() + days * 86400000)
        });

        // Add timeline entry
        await IssueTimeline.create({
            issueId: issue.id,
            status: 'submitted',
            message: 'Issue submitted by citizen',
            updatedById: req.user.id
        });

        // Increment user values
        await User.increment(
            { points: 15, reportCount: 1, treesSaved: 0.02, co2Reduced: 0.5, paperSaved: 5 },
            { where: { id: req.user.id } }
        );

        // Notify user
        await Notification.create({
            userId: req.user.id,
            title: 'Issue Submitted!',
            message: `Your issue "${title}" submitted. +15 pts!`,
            type: 'status_update',
            relatedIssueId: issue.id
        });

        const reporter = await User.findByPk(req.user.id);
        if (reporter && (reporter.email || reporter.whatsapp)) {
            await notifyIssueUpdate(reporter, title, 'submitted', issue.id.toString());
            console.log(`[NOTIFICATION] Submission sent to reporter: ${reporter.email || reporter.whatsapp || 'N/A'}`);
        }

        // Notify all admins of the new issue
        const admins = await User.findAll({ where: { role: 'admin' } });
        const adminNotifs = admins.map(a => ({
            userId: a.id,
            title: 'New Issue Reported 🚨',
            message: `A new ${severity} severity issue "${title}" was reported.`,
            type: 'system',
            relatedIssueId: issue.id
        }));
        if (adminNotifs.length) {
            await Notification.bulkCreate(adminNotifs);
        }

        const responseIssue = await Issue.findByPk(issue.id, {
            include: [{ model: User, as: 'reportedBy', attributes: ['name', 'avatar', 'level'] }]
        });
        const mappedIssue = await mapIssueForResponse(responseIssue);

        res.status(201).json(mappedIssue);
    } catch (err) {
        console.error('Create issue error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// PUT /api/issues/:id/upvote
router.put('/:id/upvote', authMiddleware, async (req, res) => {
    try {
        if (!useDB()) { // Demo mode
            const issue = DEMO_ISSUES.find(i => i.id === req.params.id);
            if (!issue) return res.status(404).json({ message: 'Issue not found' });
            const already = issue.upvotes.includes(req.user.id);
            if (already) {
                issue.upvotes = issue.upvotes.filter(id => id !== req.user.id);
                issue.upvoteCount = Math.max(0, issue.upvoteCount - 1);
            }
            else {
                issue.upvotes.push(req.user.id);
                issue.upvoteCount++;
            }
            return res.json({ upvoteCount: issue.upvoteCount, upvoted: !already });
        }

        // DB mode
        if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Invalid Issue ID format' });

        const issue = await Issue.findByPk(req.params.id);
        if (!issue) return res.status(404).json({ message: 'Issue not found' });

        const userId = req.user.id;
        const alreadyUpvoted = await IssueUpvote.findOne({
            where: { issueId: req.params.id, userId }
        });

        if (alreadyUpvoted) {
            await alreadyUpvoted.destroy();
            await issue.decrement('upvoteCount', { by: 1 });
        } else {
            await IssueUpvote.create({ issueId: req.params.id, userId });
            await issue.increment('upvoteCount', { by: 1 });
            await User.increment({ points: 2, upvotesGiven: 1 }, { where: { id: userId } });
        }

        const updatedIssue = await Issue.findByPk(req.params.id);
        res.json({ upvoteCount: updatedIssue.upvoteCount, upvoted: !alreadyUpvoted });
    } catch (err) {
        console.error('Upvote error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/issues/:id/status - admin only
router.put('/:id/status', authMiddleware, upload.single('resolvedImage'), async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'dept_admin')
            return res.status(403).json({ message: 'Admin only access required' });

        const { status, message, assignedDept } = req.body;

        if (!useDB()) {
            const demoIssue = DEMO_ISSUES.find(i => i.id === req.params.id);
            if (!demoIssue) return res.status(404).json({ message: 'Issue not found' });

            demoIssue.status = status;
            if (assignedDept) demoIssue.assignedDept = assignedDept;
            demoIssue.timeline.push({ status, message: message || `Status updated to ${status}`, timestamp: new Date() });

            console.log(`[EMAIL/SMS MOCK] Sending Email & SMS to user: Issue "${demoIssue.title}" status updated to ${status}`);
            return res.json(demoIssue);
        }

        if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Invalid Issue ID format' });

        const issue = await Issue.findByPk(req.params.id, {
            include: [{ model: User, as: 'reportedBy' }]
        });
        if (!issue) return res.status(404).json({ message: 'Issue not found' });

        // Dept admins can only update issues assigned to their department
        if (req.user.role === 'dept_admin' && issue.assignedDept !== req.user.department) {
            return res.status(403).json({ message: 'You can only update issues assigned to your department' });
        }

        const updateObj = { status };
        if (assignedDept) updateObj.assignedDept = assignedDept;
        if (req.file) updateObj.resolvedImage = `/uploads/${req.file.filename}`;

        if (status === 'resolved') {
            updateObj.resolvedAt = new Date();
            // Award points to reporter
            if (issue.reportedBy && issue.reportedBy.id) {
                await User.increment(
                    { points: 25, resolvedCount: 1 },
                    { where: { id: issue.reportedBy.id } }
                );
            }
        }
        updateObj.updatedAt = new Date();
        await issue.update(updateObj);

        // Add timeline entry
        await IssueTimeline.create({
            issueId: issue.id,
            status,
            message: message || `Status updated to ${status}`,
            updatedById: req.user.id
        });

        if (issue.reportedBy && issue.reportedBy.id) {
            // Notify reporter
            await Notification.create({
                userId: issue.reportedBy.id,
                title: `Issue ${status === 'resolved' ? 'Resolved! 🎉' : 'Updated'}`,
                message: message || `Your issue "${issue.title}" status changed to ${status}`,
                type: 'status_update',
                relatedIssueId: issue.id
            });

            // Real WhatsApp + Email notification
            const reporter = await User.findByPk(issue.reportedBy.id);
            await notifyIssueUpdate(reporter, issue.title, status, issue.id.toString());
            console.log(`[NOTIFICATION] Sent to reporter: ${reporter.email || 'N/A'}`);
        }

        const reloaded = await Issue.findByPk(issue.id, {
            include: [
                { model: User, as: 'reportedBy', attributes: ['name', 'avatar', 'level'] },
                {
                    model: IssueTimeline,
                    as: 'timeline',
                    include: [{ model: User, as: 'updatedBy', attributes: ['name'] }]
                }
            ]
        });
        const mappedIssue = await mapIssueForResponse(reloaded);

        res.json(mappedIssue);
    } catch (err) {
        console.error('Update issue status error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// GET /api/issues/user/mine
router.get('/user/mine', authMiddleware, async (req, res) => {
    try {
        if (!useDB()) {
            const mine = DEMO_ISSUES.filter(i =>
                (i.reportedBy?.id === req.user.id) ||
                (req.user.id === 'demo_citizen_001' && ['demo_i1', 'demo_i2'].includes(i.id))
            );
            return res.json({ issues: mine, total: mine.length });
        }

        const { status, category, sort = '-createdAt', page = 1, limit = 10 } = req.query;
        const filter = { reportedById: req.user.id };
        if (status && status !== 'all') filter.status = status;
        if (category && category !== 'all') filter.category = category;

        let order = [['createdAt', 'DESC']];
        if (sort) {
            const isDesc = sort.startsWith('-');
            const field = isDesc ? sort.substring(1) : sort;
            order = [[field, isDesc ? 'DESC' : 'ASC']];
        }

        const limitNum = parseInt(limit);
        const offset = (parseInt(page) - 1) * limitNum;

        const issues = await Issue.findAll({
            where: filter,
            order,
            limit: limitNum,
            offset
        });

        const total = await Issue.count({ where: { reportedById: req.user.id } });
        const mappedIssues = await Promise.all(issues.map(mapIssueForResponse));

        res.json({ issues: mappedIssues, total });
    } catch (err) {
        console.error('Get my issues error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
