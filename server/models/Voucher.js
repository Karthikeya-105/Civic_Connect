const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    pointsCost: { type: Number, required: true },
    discountValue: { type: String, default: '' }, // e.g. "10% off", "₹100 off"
    category: { type: String, default: 'general' }, // fuel, grocery, electricity, transport, general
    imageEmoji: { type: String, default: '🎟️' },
    totalStock: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) }, // 90 days default
    claimedBy: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        code: { type: String },
        claimedAt: { type: Date, default: Date.now }
    }],
    partner: { type: String, default: '' }, // e.g. "Indian Oil", "BigBasket"
    termsConditions: { type: String, default: 'Subject to availability. Cannot be combined with other offers.' },
}, { timestamps: true });

// Virtual for remaining stock
voucherSchema.virtual('remaining').get(function () {
    return this.totalStock - this.claimedBy.length;
});

voucherSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Voucher', voucherSchema);
