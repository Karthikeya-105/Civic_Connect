const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { Op } = require('sequelize');
const authMiddleware = require('../middleware/auth');
const { Voucher, VoucherClaim, User } = require('../models');

const isDBConnected = () => {
    return !!process.env.DB_HOST;
};

// ─── DEMO VOUCHERS (when DB not connected) ────────────────────────────────────
const DEMO_VOUCHERS = [
    { id: 'v1', title: 'Fuel Discount', description: '10% off on fuel at Indian Oil pumps', pointsCost: 50, discountValue: '10% off', category: 'fuel', imageEmoji: '⛽', totalStock: 200, remaining: 156, isActive: true, partner: 'Indian Oil', expiresAt: new Date(Date.now() + 60 * 86400000), termsConditions: 'Valid at select Indian Oil outlets.' },
    { id: 'v2', title: 'Grocery Voucher', description: '₹100 off on grocery purchase above ₹500', pointsCost: 80, discountValue: '₹100 off', category: 'grocery', imageEmoji: '🛒', totalStock: 150, remaining: 89, isActive: true, partner: 'BigBasket', expiresAt: new Date(Date.now() + 45 * 86400000), termsConditions: 'Min order ₹500. One per user.' },
    { id: 'v3', title: 'Electricity Bill', description: '₹50 waiver on electricity bill', pointsCost: 100, discountValue: '₹50 off bill', category: 'electricity', imageEmoji: '⚡', totalStock: 100, remaining: 42, isActive: true, partner: 'BESCOM', expiresAt: new Date(Date.now() + 30 * 86400000), termsConditions: 'Valid for residential consumers only.' },
    { id: 'v4', title: 'Bus Pass Discount', description: '20% off on monthly bus pass', pointsCost: 60, discountValue: '20% off', category: 'transport', imageEmoji: '🚌', totalStock: 300, remaining: 210, isActive: true, partner: 'BMTC', expiresAt: new Date(Date.now() + 90 * 86400000), termsConditions: 'Valid at city bus pass counters.' },
    { id: 'v5', title: 'Tree Sapling', description: 'Get a free plant sapling from city nursery', pointsCost: 30, discountValue: 'Free sapling', category: 'environment', imageEmoji: '🌱', totalStock: 500, remaining: 342, isActive: true, partner: 'City Horticulture', expiresAt: new Date(Date.now() + 120 * 86400000), termsConditions: 'Collect from nearest city nursery.' },
    { id: 'v6', title: 'Cinema Ticket', description: '₹150 off on movie tickets at PVR', pointsCost: 120, discountValue: '₹150 off', category: 'entertainment', imageEmoji: '🎬', totalStock: 80, remaining: 38, isActive: true, partner: 'PVR Cinemas', expiresAt: new Date(Date.now() + 30 * 86400000), termsConditions: 'Valid on weekdays only.' },
    { id: 'v7', title: 'Water Bill Waiver', description: '₹75 off on water utility bill', pointsCost: 90, discountValue: '₹75 off', category: 'utility', imageEmoji: '💧', totalStock: 120, remaining: 67, isActive: true, partner: 'City Water Board', expiresAt: new Date(Date.now() + 60 * 86400000), termsConditions: 'For residential connections only.' },
    { id: 'v8', title: 'Online Shopping', description: '15% off on Flipkart purchase above ₹1000', pointsCost: 150, discountValue: '15% off', category: 'shopping', imageEmoji: '🛍️', totalStock: 50, remaining: 22, isActive: true, partner: 'Flipkart', expiresAt: new Date(Date.now() + 20 * 86400000), termsConditions: 'Max discount ₹300. Single use.' },
    { id: 'v9', title: 'Organic Farming Kit', description: 'Complete starter kit for terrace organic farming', pointsCost: 200, discountValue: 'Free Kit', category: 'environment', imageEmoji: '🪴', totalStock: 40, remaining: 15, isActive: true, partner: 'EcoNursery', expiresAt: new Date(Date.now() + 180 * 86400000), termsConditions: 'Includes seeds, organic compost, and grow bags.' },
    { id: 'v10', title: 'Solar Power Charger', description: 'Portable solar power bank for mobile devices', pointsCost: 350, discountValue: 'Free Device', category: 'technology', imageEmoji: '🔋', totalStock: 25, remaining: 8, isActive: true, partner: 'GreenTech', expiresAt: new Date(Date.now() + 180 * 86400000), termsConditions: '10000mAh solar power bank.' },
];

// User's demo redeemed vouchers (in-memory for demo mode)
const demoRedeemed = {};

// Generate voucher code
const generateCode = () => 'CVC-' + crypto.randomBytes(4).toString('hex').toUpperCase();

// ─── GET all active vouchers ──────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
    try {
        if (!isDBConnected()) {
            return res.json(DEMO_VOUCHERS);
        }
        
        let vouchers = await Voucher.findAll({
            where: {
                isActive: true,
                expiresAt: {
                    [Op.gte]: new Date()
                }
            },
            include: [{ model: VoucherClaim, as: 'claimedBy' }],
            order: [['pointsCost', 'ASC']]
        });

        // Auto-seed if empty
        if (vouchers.length === 0) {
            const toSeed = DEMO_VOUCHERS.map(v => ({
                title: v.title, description: v.description, pointsCost: v.pointsCost,
                discountValue: v.discountValue, category: v.category, imageEmoji: v.imageEmoji,
                totalStock: v.totalStock, partner: v.partner,
                expiresAt: v.expiresAt, isActive: true, termsConditions: v.termsConditions
            }));
            await Voucher.bulkCreate(toSeed);
            
            vouchers = await Voucher.findAll({
                where: { isActive: true },
                include: [{ model: VoucherClaim, as: 'claimedBy' }],
                order: [['pointsCost', 'ASC']]
            });
        }

        const list = vouchers.map(v => {
            const val = v.toJSON();
            const claimedCount = val.claimedBy ? val.claimedBy.length : 0;
            val.remaining = val.totalStock - claimedCount;
            delete val.claimedBy;
            return val;
        });

        res.json(list);
    } catch (err) {
        console.error('Vouchers error:', err);
        res.json(DEMO_VOUCHERS); // fallback
    }
});

// ─── GET my redeemed vouchers ─────────────────────────────────────────────────
router.get('/my', authMiddleware, async (req, res) => {
    try {
        if (!isDBConnected()) {
            return res.json(demoRedeemed[req.user.id] || []);
        }

        const claims = await VoucherClaim.findAll({
            where: { userId: req.user.id },
            include: [{
                model: Voucher,
                attributes: ['title', 'imageEmoji', 'category', 'discountValue', 'partner']
            }],
            order: [['claimedAt', 'DESC']]
        });

        const populated = claims.map(c => ({
            id: c.id,
            voucherId: c.voucherId,
            code: c.code,
            redeemedAt: c.claimedAt,
            voucher: c.Voucher
        }));

        res.json(populated);
    } catch (err) {
        console.error('My redeemed vouchers error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── POST redeem a voucher ────────────────────────────────────────────────────
router.post('/redeem/:id', authMiddleware, async (req, res) => {
    try {
        const code = generateCode();

        if (!isDBConnected()) {
            const voucher = DEMO_VOUCHERS.find(v => v.id === req.params.id);
            if (!voucher) return res.status(404).json({ message: 'Voucher not found' });
            if (!voucher.isActive) return res.status(400).json({ message: 'Voucher is no longer active' });
            if (voucher.remaining <= 0) return res.status(400).json({ message: 'Voucher out of stock' });

            if (!demoRedeemed[req.user.id]) demoRedeemed[req.user.id] = [];
            const alreadyRedeemed = demoRedeemed[req.user.id].find(r => r.voucherId === req.params.id);
            if (alreadyRedeemed) return res.status(400).json({ message: 'You already redeemed this voucher', code: alreadyRedeemed.code });

            voucher.remaining--;
            demoRedeemed[req.user.id].push({ voucherId: req.params.id, code, redeemedAt: new Date(), title: voucher.title, imageEmoji: voucher.imageEmoji });
            return res.json({ success: true, code, voucher, message: `Voucher redeemed! Your code: ${code}` });
        }

        const voucher = await Voucher.findByPk(req.params.id);
        if (!voucher || !voucher.isActive) return res.status(404).json({ message: 'Voucher not found or inactive' });

        const claimedCount = await VoucherClaim.count({ where: { voucherId: req.params.id } });
        if (claimedCount >= voucher.totalStock) return res.status(400).json({ message: 'Voucher out of stock' });

        const alreadyClaimed = await VoucherClaim.findOne({
            where: { voucherId: req.params.id, userId: req.user.id }
        });
        if (alreadyClaimed) return res.status(400).json({ message: 'Already redeemed', code: alreadyClaimed.code });

        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.points < voucher.pointsCost) return res.status(400).json({ message: `Not enough points. Need ${voucher.pointsCost}, you have ${user.points}` });

        // Deduct points and save
        user.points -= voucher.pointsCost;
        await user.save();

        // Create Voucher Claim
        await VoucherClaim.create({
            voucherId: voucher.id,
            userId: user.id,
            code,
            claimedAt: new Date()
        });

        const vJson = voucher.toJSON();
        vJson.remaining = voucher.totalStock - (claimedCount + 1);

        res.json({ success: true, code, voucher: vJson, newPoints: user.points, message: `Voucher redeemed! Your code: ${code}` });
    } catch (err) {
        console.error('Redeem error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
