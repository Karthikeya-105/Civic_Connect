const mongoose = require('mongoose');

const garbageTruckSchema = new mongoose.Schema({
    vehicleId: { type: String, required: true, unique: true },
    vehicleName: { type: String, required: true },
    driverName: { type: String, default: '' },
    driverPhone: { type: String, default: '' },
    department: { type: String, default: 'Sanitation Department' },
    area: { type: String, default: '' },
    lat: { type: Number, default: 12.9716 },
    lng: { type: Number, default: 77.5946 },
    status: { type: String, default: 'active', enum: ['active', 'idle', 'offline', 'maintenance'] },
    route: { type: String, default: '' },
    lastUpdated: { type: Date, default: Date.now },
    schedule: { type: String, default: '' }, // e.g. "Mon-Sat: 6AM-12PM"
}, { timestamps: true });

module.exports = mongoose.model('GarbageTruck', garbageTruckSchema);
