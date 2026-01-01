const axios = require('axios');
const Topic = require('../models/Topic');
// We need sessions too to pass to RAG
const Session = require('../models/Session');

let AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// Ensure protocol exists (Render provides host without protocol sometimes)
if (!AI_SERVICE_URL.startsWith('http')) {
    AI_SERVICE_URL = `https://${AI_SERVICE_URL}`;
}

// Create an axios instance with long timeout for AI generation (Render Cold Starts)
const aiClient = axios.create({
    baseURL: AI_SERVICE_URL,
    timeout: 60000 // 60 seconds
});

exports.summarizeProgress = async (req, res) => {
    try {
        // Fetch all data to send to RAG for context
        // In a real app, this might be paginated or optimized
        const topics = await Topic.find({});
        const sessions = await Session.find({});

        const userQuery = req.body.query || "Summarize my progress";

        const response = await aiClient.post('/rag/analyze', {
            topics,
            sessions,
            query: userQuery
        });

        res.json(response.data);
    } catch (err) {
        console.error("AI Service Error:", err.message);
        res.status(502).json({
            message: "AI Service unavailable. Ensure the Python RAG service is running.",
            error: err.message
        });
    }
};

exports.improveNotes = async (req, res) => {
    const { notes, topic } = req.body;

    if (!notes) {
        return res.status(400).json({ message: "Notes are required" });
    }

    try {
        const response = await aiClient.post('/rag/improve-notes', {
            notes,
            topic: topic || "General"
        });

        res.json(response.data);
    } catch (err) {
        console.error("AI Service Error:", err.message);
        res.status(502).json({
            message: "AI Service unavailable.",
            error: err.message
        });
    }
};

exports.chat = async (req, res) => {
    try {
        const { message, history } = req.body;

        // Pass history to Python service for context
        const response = await aiClient.post('/rag/chat', {
            message,
            history: history || []
        });

        res.json(response.data);
    } catch (err) {
        console.error("AI Service Error:", err.message);
        res.status(502).json({
            message: "Chat unavailable.",
            error: err.message
        });
    }
};

exports.generateStudyPlan = async (req, res) => {
    try {
        const { topics, goals, hours } = req.body;
        const response = await aiClient.post('/rag/plan', {
            topics,
            goals,
            hours_per_week: parseInt(hours) || 10
        });
        res.json(response.data);
    } catch (err) {
        console.error("AI Service Error:", err.message);
        if (err.response) {
            // Upstream service returned an error (4xx, 5xx)
            res.status(err.response.status).json({
                message: "AI Service Error",
                error: err.response.data
            });
        } else if (err.request) {
            // Request made but no response (Timeout/Network)
            res.status(504).json({
                message: "AI Service Timeout",
                error: "No response received from AI service. It might be starting up."
            });
        } else {
            // Something else happened
            res.status(500).json({
                message: "Internal Server Error",
                error: err.message
            });
        }
    }
};

exports.getResources = async (req, res) => {
    try {
        const response = await aiClient.get('/rag/knowledge');
        res.json(response.data);
    } catch (err) {
        handleAiError(res, err);
    }
};

exports.addResource = async (req, res) => {
    try {
        const { category, content } = req.body;
        // Proxy to AI Service
        const response = await aiClient.post('/rag/knowledge', {
            category,
            content
        });
        res.json(response.data);
    } catch (err) {
        handleAiError(res, err);
    }
};

// Helper function for consistent error handling
const handleAiError = (res, err) => {
    console.error("AI Service Error:", err.message);
    if (err.response) {
        // Upstream service returned an error (4xx, 5xx)
        // Pass through the status and data
        res.status(err.response.status).json(err.response.data);
    } else if (err.request) {
        // Request made but no response (Timeout/Network)
        res.status(504).json({
            message: "AI Service Timeout",
            error: "The AI service is talking too long to respond. It works on a free tier and might be waking up. Please try again in 30 seconds."
        });
    } else {
        // Something else happened
        res.status(502).json({
            message: "AI Service Connectivity Error",
            error: err.message
        });
    }
};
