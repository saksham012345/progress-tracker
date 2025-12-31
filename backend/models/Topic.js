const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['Not Started', 'In Progress', 'Revised'],
        default: 'Not Started'
    },
    goal: {
        type: String, // e.g. "Master Recursion"
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Topic', topicSchema);
