const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
        // Add regex for email validation if stricter check needed
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Gamification fields
    points: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    streak: {
        type: Number,
        default: 0
    },
    lastActivityDate: {
        type: Date
    },
    badges: [{
        name: String,
        icon: String,
        earnedAt: { type: Date, default: Date.now }
    }],
    // Spaced repetition: track last review date per topic
    topicReviews: [{
        topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
        lastReviewed: Date,
        nextReview: Date,
        easeFactor: { type: Number, default: 2.5 }, // SM-2 algorithm
        interval: { type: Number, default: 1 },     // days
        repetitions: { type: Number, default: 0 }
    }],
    // Chat history persistence
    chatHistory: [{
        role: { type: String, enum: ['user', 'assistant'] },
        content: String,
        timestamp: { type: Date, default: Date.now }
    }]
});

module.exports = mongoose.model('User', userSchema);
