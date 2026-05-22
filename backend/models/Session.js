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
    mood: {
        type: String,
        enum: ['Great', 'Good', 'Okay', 'Tired', 'Frustrated'],
        default: 'Good'
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

sessionSchema.index({ topicId: 1, date: -1 });

module.exports = mongoose.model('Session', sessionSchema);
