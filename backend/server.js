const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');

// Middleware
app.use(helmet()); // Security Headers
app.use(compression()); // Gzip Compression

// Rate Limiting (Limit each IP to 100 requests per 15 minutes)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// CORS — allow Vercel production + preview deployments
const allowedOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Render health checks)
        if (!origin) return callback(null, true);
        // Allow any vercel.app subdomain + explicitly listed origins
        if (
            allowedOrigins.includes(origin) ||
            /\.vercel\.app$/.test(origin) ||
            origin === 'http://localhost:5173' ||
            origin === 'http://localhost:3000'
        ) {
            return callback(null, true);
        }
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(morgan('dev')); // Request logging

// Root Route (for health check)
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: 'HyperActive Backend is running',
        dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Database Connection
console.log("🔌 Attempting to connect to MongoDB...");
console.log("📝 MONGODB_URI is set:", !!process.env.MONGODB_URI); // Log true/false only for security

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ MongoDB connection established successfully'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('   (Check your Render Environment Variable MONGODB_URI)');
    });

// Routes
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);

// Make io accessible to controllers via req.app.get('io')
// Must be set AFTER io is created — done below after server/io init

// Error Handler (Must be last)
app.use(errorHandler);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Detailed Health Check (including AI service)
app.get('/api/health/detailed', async (req, res) => {
    try {
        const axios = require('axios');
        const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
        const aiServiceUrl = AI_SERVICE_URL.startsWith('http') ? AI_SERVICE_URL : `https://${AI_SERVICE_URL}`;
        
        let aiStatus = 'unknown';
        try {
            const aiResponse = await axios.get(`${aiServiceUrl}/`, { timeout: 3000 });
            aiStatus = aiResponse.status === 200 ? 'healthy' : 'unreachable';
        } catch (err) {
            aiStatus = 'unreachable';
        }
        
        res.json({
            backend: 'healthy',
            database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            aiService: aiStatus,
            aiServiceUrl: aiServiceUrl,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (
                allowedOrigins.includes(origin) ||
                /\.vercel\.app$/.test(origin) ||
                origin === 'http://localhost:5173' ||
                origin === 'http://localhost:3000'
            ) return callback(null, true);
            callback(new Error('Socket CORS not allowed'));
        },
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Socket.io Logic
io.on('connection', (socket) => {
    // Accept token from either auth or query (backwards compat)
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    console.log('👤 User connected:', socket.id);

    socket.on('joinWorkspace', (workspaceId) => {
        socket.join(workspaceId);
        console.log(`📂 User joined workspace: ${workspaceId}`);
    });

    socket.on('sendMessage', async (data) => {
        // data: { workspaceId, senderId, senderName, text }
        try {
            const Message = require('./models/Message');
            const newMessage = new Message(data);
            await newMessage.save();
            
            // Broadcast to the workspace
            io.to(data.workspaceId).emit('receiveMessage', newMessage);
        } catch (err) {
            console.error('❌ Socket Error:', err.message);
        }
    });

    socket.on('startStudy', (data) => {
        // data: { workspaceId, userId, username, topicTitle }
        socket.to(data.workspaceId).emit('userStartedStudy', data);
        console.log(`📖 ${data.username} started studying in ${data.workspaceId}`);
    });

    socket.on('stopStudy', (data) => {
        // data: { workspaceId, userId }
        socket.to(data.workspaceId).emit('userStoppedStudy', data);
    });

    socket.on('noteUpdate', (data) => {
        // data: { workspaceId, noteId, content, updatedBy }
        socket.to(data.workspaceId).emit('receiveNoteUpdate', data);
    });

    // Real-time topic/session updates — broadcast to all sockets of the same user
    socket.on('joinUserRoom', (userId) => {
        socket.join(`user:${userId}`);
    });

    socket.on('disconnect', () => {
        console.log('🔌 User disconnected');
    });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    // Attach io to app so controllers can emit events via req.app.get('io')
    app.set('io', io);
});
