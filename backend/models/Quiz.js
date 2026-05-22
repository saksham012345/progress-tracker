const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
    questions: [{
        question: String,
        userAnswer: String,
        correctAnswer: String,
        isCorrect: Boolean,
        xpAwarded: { type: Number, default: 0 }
    }],
    score: { type: Number, default: 0 },       // percentage
    xpEarned: { type: Number, default: 0 },
    completedAt: { type: Date, default: Date.now }
});

quizSchema.index({ userId: 1, topicId: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
