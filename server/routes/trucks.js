const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/auth');

const isDBConnected = () => mongoose.connection.readyState === 1;

const adminOrDeptAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'dept_admin') {
        return res.status(403).json({ message: 'Admin only' });
    }
    next();
};

// Demo trucks data
const DEMO_TRUCKS = [
    { _id: 't1', vehicleId: 'KA-01-GC-001', vehicleName: 'GreenWheels Alpha', driverName: 'Ramesh Kumar', driverPhone: '+91 9876543210', department: 'Sanitation Department', area: 'Sector 12, Rohini', lat: 28.7041, lng: 77.1025, status: 'active', route: 'Rohini - Sector 12 to 18', lastUpdated: new Date(), schedule: 'Mon-Sat: 6AM-12PM' },
    { _id: 't2', vehicleId: 'KA-01-GC-002', vehicleName: 'EcoTruck Bravo', driverName: 'Suresh Singh', driverPhone: '+91 9876543211', department: 'Sanitation Department', area: 'Connaught Place', lat: 28.6328, lng: 77.2197, status: 'active', route: 'CP Inner & Outer Circles', lastUpdated: new Date(), schedule: 'Mon-Sat: 7AM-1PM' },
    { _id: 't3', vehicleId: 'KA-01-GC-003', vehicleName: 'CleanCity Charlie', driverName: 'Mahesh Rao', driverPhone: '+91 9876543212', department: 'Sanitation Department', area: 'Lajpat Nagar', lat: 28.5672, lng: 77.2434, status: 'idle', route: 'Lajpat Nagar Market', lastUpdated: new Date(Date.now() - 30 * 60000), schedule: 'Mon-Sat: 5AM-11AM' },
    { _id: 't4', vehicleId: 'MH-01-GC-004', vehicleName: 'SwachhTruck Delta', driverName: 'Pradeep Nair', driverPhone: '+91 9876543213', department: 'Sanitation Department', area: 'Karol Bagh', lat: 28.6519, lng: 77.1903, status: 'active', route: 'Karol Bagh Main Market', lastUpdated: new Date(), schedule: 'Mon-Sat: 6AM-12PM' },
    { _id: 't5', vehicleId: 'MH-01-GC-005', vehicleName: 'GreenGuard Echo', driverName: 'Vikram Patel', driverPhone: '+91 9876543214', department: 'Sanitation Department', area: 'Dwarka Sector 10', lat: 28.5875, lng: 77.0430, status: 'maintenance', route: 'Dwarka Sectors 10-13', lastUpdated: new Date(Date.now() - 120 * 60000), schedule: 'Mon-Sat: 7AM-1PM' },
];

// In-memory truck positions for demo mode
let demoTrucks = JSON.parse(JSON.stringify(DEMO_TRUCKS));

// GET /api/trucks - all trucks (public)
router.get('/', async (req, res) => {
    try {
        if (!isDBConnected()) {
            return res.json(demoTrucks);
        }
        const GarbageTruck = require('../models/GarbageTruck');
        let trucks = await GarbageTruck.find().sort('status');
        // Auto-seed if no trucks in DB
        if (trucks.length === 0) {
            const toSeed = DEMO_TRUCKS.map(({ _id, ...t }) => ({ ...t }));
            await GarbageTruck.insertMany(toSeed);
            trucks = await GarbageTruck.find().sort('status');
        }
        res.json(trucks);
    } catch (err) {
        console.error('Trucks error:', err);
        res.json(demoTrucks); // fallback
    }
});

// POST /api/trucks - create truck (admin only)
router.post('/', authMiddleware, adminOrDeptAdmin, async (req, res) => {
    try {
        const { vehicleId, vehicleName, driverName, driverPhone, area, lat, lng, route, schedule, status } = req.body;
        if (!isDBConnected()) {
            const newTruck = {
                _id: 't' + Date.now(), vehicleId, vehicleName, driverName, driverPhone,
                area, lat: lat || 28.7041, lng: lng || 77.1025,
                status: status || 'active', route, lastUpdated: new Date(), schedule,
                department: 'Sanitation Department'
            };
            demoTrucks.push(newTruck);
            if (global.io) global.io.emit('truck_update', newTruck);
            return res.status(201).json(newTruck);
        }
        const GarbageTruck = require('../models/GarbageTruck');
        const truck = new GarbageTruck({ vehicleId, vehicleName, driverName, driverPhone, area, lat, lng, route, schedule, status });
        await truck.save();
        if (global.io) global.io.emit('truck_update', truck);
        res.status(201).json(truck);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/trucks/:id/location - update truck location (admin)
router.put('/:id/location', authMiddleware, adminOrDeptAdmin, async (req, res) => {
    try {
        const { lat, lng, status, area } = req.body;
        if (!isDBConnected()) {
            const truck = demoTrucks.find(t => t._id === req.params.id);
            if (!truck) return res.status(404).json({ message: 'Truck not found' });
            if (lat !== undefined) truck.lat = parseFloat(lat);
            if (lng !== undefined) truck.lng = parseFloat(lng);
            if (status) truck.status = status;
            if (area) truck.area = area;
            truck.lastUpdated = new Date();
            if (global.io) global.io.emit('truck_update', truck);
            return res.json(truck);
        }
        const GarbageTruck = require('../models/GarbageTruck');
        const update = { lastUpdated: new Date() };
        if (lat !== undefined) update.lat = parseFloat(lat);
        if (lng !== undefined) update.lng = parseFloat(lng);
        if (status) update.status = status;
        if (area) update.area = area;
        const truck = await GarbageTruck.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!truck) return res.status(404).json({ message: 'Truck not found' });
        if (global.io) global.io.emit('truck_update', truck);
        res.json(truck);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /api/trucks/:id (admin)
router.delete('/:id', authMiddleware, adminOrDeptAdmin, async (req, res) => {
    try {
        if (!isDBConnected()) {
            demoTrucks = demoTrucks.filter(t => t._id !== req.params.id);
            return res.json({ success: true });
        }
        const GarbageTruck = require('../models/GarbageTruck');
        await GarbageTruck.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
