const express = require('express');
const { sequelize } = require('./models');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Attach io to request
app.use((req, res, next) => { req.io = io; next(); });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/vouchers', require('./routes/vouchers'));
app.use('/api/trucks', require('./routes/trucks'));

// Health check
app.get('/api/health', (req, res) => res.json({
    status: 'ok',
    time: new Date().toISOString(),
    env: process.env.NODE_ENV
}));

// Socket.IO
const connectedUsers = {};
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join', (userId) => {
        connectedUsers[userId] = socket.id;
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined room`);
    });

    socket.on('disconnect', () => {
        Object.keys(connectedUsers).forEach(k => {
            if (connectedUsers[k] === socket.id) delete connectedUsers[k];
        });
    });
});

// Make io available globally for emitting from routes
global.io = io;

// Connect to Database (PostgreSQL on Render, MySQL locally)
const PORT = process.env.PORT || 5000;

sequelize.authenticate()
    .then(() => {
        console.log('✅ Database connected');
        return sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    })
    .then(() => {
        console.log('✅ Database models synchronized');
        server.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Database Connection or Sync Failed!');
        console.error('Error:', err.message);

        console.warn('⚠️  CRITICAL: Database connection failed.');
        console.warn('⚠️  The app will start in DEMO MODE, but data will NOT be saved to the database.');

        server.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT} (FALLBACK DEMO MODE)`);
        });
    });

module.exports = { app, io };
