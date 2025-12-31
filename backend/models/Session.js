const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    duration: {
        type: Number, // in minutes
        required: true
    },
    notes: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Session', sessionSchema);
