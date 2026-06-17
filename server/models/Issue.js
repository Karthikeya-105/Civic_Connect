const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
        type: String,
        enum: ['garbage', 'roads', 'water', 'sanitation', 'lighting', 'electricity', 'drainage', 'other'],
        required: true
    },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    status: {
        type: String,
        enum: ['submitted', 'verified', 'assigned', 'progress', 'resolved', 'closed'],
        default: 'submitted'
    },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        address: { type: String, default: '' },
        ward: { type: String, default: '' },
        district: { type: String, default: '' },
    },
    images: [{ type: String }],
    resolvedImage: { type: String, default: '' },
    audio: { type: String, default: '' },

    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: String, default: '' },
    assignedDept: { type: String, default: '' },

    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    upvoteCount: { type: Number, default: 0 },

    // AI metadata
    aiCategory: { type: String, default: '' },
    aiConfidence: { type: Number, default: 0 },
    aiSeverity: { type: String, default: '' },
    isDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', default: null },

    // Timeline
    timeline: [{
        status: String,
        message: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now }
    }],

    // Gamification
    pointsAwarded: { type: Number, default: 15 },
    verifiedByCount: { type: Number, default: 0 },

    // Before-after verification
    resolutionVerified: { type: Boolean, default: false },
    resolutionVerifiedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    estimatedResolution: { type: Date },
    resolvedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

issueSchema.index({ 'location.lat': 1, 'location.lng': 1 });
issueSchema.index({ category: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Issue', issueSchema);
