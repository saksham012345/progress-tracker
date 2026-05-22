const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace'
    },
    subTasks: [{
        title: String,
        completed: { type: Boolean, default: false }
    }],
    deadline: {
        type: Date
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    totalStudyMinutes: {
        type: Number,
        default: 0
    },
    nextReviewDate: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for fast user-scoped queries
topicSchema.index({ userId: 1, createdAt: -1 });
topicSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Topic', topicSchema);
