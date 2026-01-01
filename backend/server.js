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

// Middleware
app.use(helmet()); // Security Headers
app.use(compression()); // Gzip Compression

// Rate Limiting (Limit each IP to 100 requests per 15 minutes)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// CORS Configuration (Allow Vercel Frontend)
const corsOptions = {
    origin: process.env.FRONTEND_URL || '*', // Fallback to * for development
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(morgan('dev')); // Request logging

// Root Route (for health check)
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: 'NeuroTrack Backend is running',
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

// Error Handler (Must be last)
app.use(errorHandler);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
