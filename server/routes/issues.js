const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const Issue = require('../models/Issue');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { notifyIssueUpdate, sendEmail } = require('../middleware/notify');

const useDB = () => mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2;
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ── Demo issues for no-DB mode ──────────────────────────────────────────────
const DEMO_ISSUES = [
    { _id: 'demo_i1', title: 'Large Pothole on MG Road', description: 'Dangerous pothole causing accidents near the main junction. Cars are swerving dangerously.', category: 'roads', severity: 'high', status: 'progress', location: { lat: 28.6139, lng: 77.2090, address: 'MG Road, New Delhi' }, images: [], upvotes: [], upvoteCount: 24, assignedDept: 'Public Works Department', reportedBy: { name: 'Priya Sharma', level: 'Civic Volunteer' }, aiCategory: 'roads', aiConfidence: 95, timeline: [{ status: 'submitted', message: 'Issue submitted by citizen', timestamp: new Date(Date.now() - 5 * 86400000) }, { status: 'progress', message: 'Team dispatched for repair', timestamp: new Date(Date.now() - 86400000) }], createdAt: new Date(Date.now() - 5 * 86400000), estimatedResolution: new Date(Date.now() + 2 * 86400000) },
    { _id: 'demo_i2', title: 'Overflowing Garbage Bins in Sector 12', description: 'Garbage bins have not been emptied for 5 days. Extremely foul smell and health hazard.', category: 'garbage', severity: 'high', status: 'submitted', location: { lat: 28.7041, lng: 77.1025, address: 'Sector 12, Rohini, Delhi' }, images: [], upvotes: [], upvoteCount: 47, assignedDept: 'Sanitation Department', reportedBy: { name: 'Amit Kumar', level: 'Eco Warrior' }, timeline: [{ status: 'submitted', message: 'Issue submitted', timestamp: new Date(Date.now() - 2 * 86400000) }], createdAt: new Date(Date.now() - 2 * 86400000) },
    { _id: 'demo_i3', title: 'Street Light Not Working Near Park', description: 'Three streetlights near the children park are non-functional for 2 weeks. Safety risk at night.', category: 'lighting', severity: 'medium', status: 'assigned', location: { lat: 12.9716, lng: 77.5946, address: 'Cubbon Park, Bengaluru' }, images: [], upvotes: [], upvoteCount: 18, assignedDept: 'Electricity Department', reportedBy: { name: 'Lakshmi Rao', level: 'Community Guardian' }, timeline: [{ status: 'submitted', message: 'Submitted', timestamp: new Date(Date.now() - 10 * 86400000) }, { status: 'assigned', message: 'Assigned to Electricity Dept', timestamp: new Date(Date.now() - 3 * 86400000) }], createdAt: new Date(Date.now() - 10 * 86400000) },
    { _id: 'demo_i4', title: 'Water Pipeline Leakage on Station Road', description: 'Major pipe burst causing water wastage and road damage. Affecting 200+ households.', category: 'water', severity: 'critical', status: 'resolved', location: { lat: 19.0760, lng: 72.8777, address: 'Station Road, Mumbai' }, images: [], resolvedImage: '', upvotes: [], upvoteCount: 92, assignedDept: 'Water Supply Board', reportedBy: { name: 'Rahul Singh', level: 'Civic Champion' }, timeline: [{ status: 'submitted', message: 'Submitted', timestamp: new Date(Date.now() - 15 * 86400000) }, { status: 'progress', message: 'Repair team on-site', timestamp: new Date(Date.now() - 12 * 86400000) }, { status: 'resolved', message: 'Pipeline repaired and tested', timestamp: new Date(Date.now() - 8 * 86400000) }], createdAt: new Date(Date.now() - 15 * 86400000), resolvedAt: new Date(Date.now() - 8 * 86400000) },
    { _id: 'demo_i5', title: 'Open Manhole on Brigade Road', description: 'Uncovered manhole in busy pedestrian area. Already caused one injury. Immediate action needed.', category: 'drainage', severity: 'critical', status: 'verified', location: { lat: 12.9766, lng: 77.6031, address: 'Brigade Road, Bengaluru' }, images: [], upvotes: [], upvoteCount: 65, assignedDept: 'Drainage & Infrastructure', reportedBy: { name: 'Sneha Patel', level: 'Eco Warrior' }, timeline: [{ status: 'submitted', message: 'Submitted', timestamp: new Date(Date.now() - 1 * 86400000) }, { status: 'verified', message: 'Verified by admin', timestamp: new Date(Date.now() - 12 * 3600000) }], createdAt: new Date(Date.now() - 86400000) },
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
        const Issue = require('../models/Issue');
        const { category, status, severity, search, sort = '-createdAt', page = 1, limit = 20 } = req.query;
        const filter = {};
        if (category && category !== 'all') filter.category = category;
        if (status && status !== 'all') filter.status = status;
        if (severity && severity !== 'all') filter.severity = severity;
        if (search) filter.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];
        const issues = await Issue.find(filter).populate('reportedBy', 'name avatar level').sort(sort).skip((page - 1) * limit).limit(parseInt(limit));
        const total = await Issue.countDocuments(filter);
        res.json({ issues, total, pages: Math.ceil(total / limit), page: parseInt(page) });
    } catch (err) {
        console.error(err);
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
        const Issue = require('../models/Issue');
        const total = await Issue.countDocuments();
        const resolved = await Issue.countDocuments({ status: 'resolved' });
        const inProgress = await Issue.countDocuments({ status: 'progress' });
        const submitted = await Issue.countDocuments({ status: 'submitted' });
        const byCat = await Issue.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
        res.json({ total, resolved, inProgress, submitted, resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0, avgResolutionDays: 3.2, byCategory: byCat });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/issues/nearby - duplicate detection
router.get('/nearby', async (req, res) => {
    try {
        if (!useDB()) return res.json({ count: 0, issues: [] });
        const Issue = require('../models/Issue');
        const { lat, lng, radius = 0.5, category } = req.query;
        if (!lat || !lng) return res.status(400).json({ message: 'lat and lng required' });
        const latNum = parseFloat(lat), lngNum = parseFloat(lng), radiusNum = parseFloat(radius);
        const latDelta = radiusNum / 111;
        const lngDelta = radiusNum / (111 * Math.cos(latNum * Math.PI / 180));
        const filter = { 'location.lat': { $gte: latNum - latDelta, $lte: latNum + latDelta }, 'location.lng': { $gte: lngNum - lngDelta, $lte: lngNum + lngDelta }, status: { $ne: 'resolved' } };
        if (category) filter.category = category;
        const nearby = await Issue.find(filter).populate('reportedBy', 'name').limit(10);
        const filtered = nearby.filter(issue => getDistance(latNum, lngNum, issue.location.lat, issue.location.lng) <= radiusNum);
        res.json({ count: filtered.length, issues: filtered });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/issues/:id
router.get('/:id', async (req, res) => {
    try {
        if (!useDB()) {
            const demo = DEMO_ISSUES.find(i => i._id === req.params.id);
            if (!demo) return res.status(404).json({ message: 'Issue not found' });
            return res.json(demo);
        }
        if (useDB()) {
            if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Invalid Issue ID format' });
            const Issue = require('../models/Issue');
            const issue = await Issue.findById(req.params.id).populate('reportedBy', 'name avatar level points').populate('timeline.updatedBy', 'name');
            if (!issue) return res.status(404).json({ message: 'Issue not found' });
            return res.json(issue);
        }
    } catch (err) {
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
                _id: 'issue_' + Date.now(), title, description, category, severity: severity || 'medium',
                status: 'submitted', location: { lat: parseFloat(lat), lng: parseFloat(lng), address: address || '' },
                images, audio, reportedBy: { _id: req.user.id, name: req.user.name || 'You', level: 'Civic Newcomer' },
                assignedDept: getDepartment(category), aiCategory: aiCategory || '', aiConfidence: parseFloat(aiConfidence) || 0,
                upvotes: [], upvoteCount: 0, timeline: [{ status: 'submitted', message: 'Issue submitted by citizen', timestamp: new Date() }],
                estimatedResolution: new Date(Date.now() + days * 86400000), createdAt: new Date(), updatedAt: new Date()
            };
            DEMO_ISSUES.unshift(demoIssue);
            console.log(`[EMAIL/SMS MOCK] Admin notified of new issue: ${title}`);
            return res.status(201).json(demoIssue);
        }

        const Issue = require('../models/Issue');
        const User = require('../models/User');
        const Notification = require('../models/Notification');
        const issue = new Issue({
            title, description, category, severity: severity || 'medium',
            location: { lat: parseFloat(lat), lng: parseFloat(lng), address: address || '' },
            images, audio, reportedBy: req.user.id, assignedDept: getDepartment(category),
            aiCategory: aiCategory || '', aiConfidence: parseFloat(aiConfidence) || 0,
            estimatedResolution: new Date(Date.now() + days * 86400000)
        });
        issue.timeline.push({ status: 'submitted', message: 'Issue submitted by citizen', updatedBy: req.user.id });
        await issue.save();
        await User.findByIdAndUpdate(req.user.id, { $inc: { points: 15, reportCount: 1, treesSaved: 0.02, co2Reduced: 0.5, paperSaved: 5 } });
        await Notification.create({ user: req.user.id, title: 'Issue Submitted!', message: `Your issue "${title}" submitted. +15 pts!`, type: 'status_update', relatedIssue: issue._id });

        const reporter = await User.findById(req.user.id);
        if (reporter && (reporter.email || reporter.whatsapp)) {
            await notifyIssueUpdate(reporter, title, 'submitted', issue._id.toString());
            console.log(`[NOTIFICATION] Submission sent to reporter: ${reporter.email || reporter.whatsapp || 'N/A'}`);
        }

        // Notify all admins of the new issue
        const admins = await User.find({ role: 'admin' });
        const adminNotifs = admins.map(a => ({
            user: a._id,
            title: 'New Issue Reported 🚨',
            message: `A new ${severity} severity issue "${title}" was reported.`,
            type: 'system',
            relatedIssue: issue._id
        }));
        if (adminNotifs.length) await Notification.insertMany(adminNotifs);

        res.status(201).json(issue);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// PUT /api/issues/:id/upvote
router.put('/:id/upvote', authMiddleware, async (req, res) => {
    try {
        if (!useDB()) { // Demo mode
            const issue = DEMO_ISSUES.find(i => i._id === req.params.id);
            if (!issue) return res.status(404).json({ message: 'Issue not found' });
            const already = issue.upvotes.includes(req.user.id);
            if (already) { issue.upvotes = issue.upvotes.filter(id => id !== req.user.id); issue.upvoteCount = Math.max(0, issue.upvoteCount - 1); }
            else { issue.upvotes.push(req.user.id); issue.upvoteCount++; }
            return res.json({ upvoteCount: issue.upvoteCount, upvoted: !already });
        }
        // DB mode
        if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Invalid Issue ID format' });
        const issue = await Issue.findById(req.params.id);
        if (!issue) return res.status(404).json({ message: 'Issue not found' });
        const userId = req.user.id;
        const alreadyUpvoted = issue.upvotes.includes(userId);
        if (alreadyUpvoted) { issue.upvotes = issue.upvotes.filter(id => id.toString() !== userId); issue.upvoteCount = Math.max(0, issue.upvoteCount - 1); }
        else { issue.upvotes.push(userId); issue.upvoteCount += 1; await User.findByIdAndUpdate(userId, { $inc: { points: 2, upvotesGiven: 1 } }); }
        await issue.save();
        res.json({ upvoteCount: issue.upvoteCount, upvoted: !alreadyUpvoted });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/issues/:id/status - admin only
router.put('/:id/status', authMiddleware, upload.single('resolvedImage'), async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'dept_admin') return res.status(403).json({ message: 'Admin only access required' });

        const { status, message, assignedDept } = req.body;

        if (!useDB()) {
            const demoIssue = DEMO_ISSUES.find(i => i._id === req.params.id);
            if (!demoIssue) return res.status(404).json({ message: 'Issue not found' });

            demoIssue.status = status;
            if (assignedDept) demoIssue.assignedDept = assignedDept;
            demoIssue.timeline.push({ status, message: message || `Status updated to ${status}`, timestamp: new Date() });

            console.log(`[EMAIL/SMS MOCK] Sending Email & SMS to user: Issue "${demoIssue.title}" status updated to ${status}`);
            return res.json(demoIssue);
        }
        if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Invalid Issue ID format' });
        const issue = await Issue.findById(req.params.id).populate('reportedBy', 'name email phone whatsapp notifyEmail notifyWhatsapp');
        if (!issue) return res.status(404).json({ message: 'Issue not found' });

        // Dept admins can only update issues assigned to their department
        if (req.user.role === 'dept_admin' && issue.assignedDept !== req.user.department) {
            return res.status(403).json({ message: 'You can only update issues assigned to your department' });
        }

        issue.status = status;
        if (assignedDept) issue.assignedDept = assignedDept;
        if (req.file) issue.resolvedImage = `/uploads/${req.file.filename}`;

        if (status === 'resolved') {
            issue.resolvedAt = new Date();
            // Award points to reporter
            if (issue.reportedBy && issue.reportedBy._id) {
                await User.findByIdAndUpdate(issue.reportedBy._id, {
                    $inc: { points: 25, resolvedCount: 1 }
                });
            }
        }

        issue.timeline.push({
            status,
            message: message || `Status updated to ${status}`,
            updatedBy: req.user.id
        });
        issue.updatedAt = new Date();
        await issue.save();

        if (issue.reportedBy && issue.reportedBy._id) {
            // Notify reporter
            await Notification.create({
                user: issue.reportedBy._id,
                title: `Issue ${status === 'resolved' ? 'Resolved! 🎉' : 'Updated'}`,
                message: message || `Your issue "${issue.title}" status changed to ${status}`,
                type: 'status_update',
                relatedIssue: issue._id
            });

            // Real WhatsApp + Email notification
            await notifyIssueUpdate(issue.reportedBy, issue.title, status, issue._id.toString());
            console.log(`[NOTIFICATION] Sent to reporter: ${issue.reportedBy.email || 'N/A'}`);

        }

        res.json(issue);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// GET /api/issues/user/mine
router.get('/user/mine', authMiddleware, async (req, res) => {
    try {
        if (!useDB()) {
            // Return demo issues attributed to this user for demo citizen
            const mine = DEMO_ISSUES.filter(i =>
                (i.reportedBy?._id === req.user.id) ||
                (req.user.id === 'demo_citizen_001' && ['demo_i1', 'demo_i2'].includes(i._id))
            );
            return res.json({ issues: mine, total: mine.length });
        }
        const Issue = require('../models/Issue');
        const { status, category, sort = '-createdAt', page = 1, limit = 10 } = req.query;
        const filter = { reportedBy: req.user.id };
        if (status && status !== 'all') filter.status = status;
        if (category && category !== 'all') filter.category = category;
        const issues = await Issue.find(filter).sort(sort).skip((page - 1) * limit).limit(parseInt(limit));
        const total = await Issue.countDocuments({ reportedBy: req.user.id });
        res.json({ issues, total });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
