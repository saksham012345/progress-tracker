const axios = require('axios');
const Topic = require('../models/Topic');
// We need sessions too to pass to RAG
const Session = require('../models/Session');

const AI_SERVICE_URL = 'http://127.0.0.1:8000';

exports.summarizeProgress = async (req, res) => {
    try {
        // Fetch all data to send to RAG for context
        // In a real app, this might be paginated or optimized
        const topics = await Topic.find({});
        const sessions = await Session.find({});

        const userQuery = req.body.query || "Summarize my progress";

        const response = await axios.post(`${AI_SERVICE_URL}/rag/analyze`, {
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
        const response = await axios.post(`${AI_SERVICE_URL}/rag/improve-notes`, {
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
        const response = await axios.post(`${AI_SERVICE_URL}/rag/chat`, {
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
        const response = await axios.post(`${AI_SERVICE_URL}/rag/plan`, {
            topics,
            goals,
            hours_per_week: parseInt(hours) || 10
        });
        res.json(response.data);
    } catch (err) {
        console.error("AI Service Error:", err.message);
        res.status(502).json({
            message: "Could not generate plan.",
            error: err.message
        });
    }
};

exports.getResources = async (req, res) => {
    try {
        const response = await axios.get(`${AI_SERVICE_URL}/rag/knowledge`);
        res.json(response.data);
    } catch (err) {
        console.error("AI Service Error:", err.message);
        res.status(502).json({
            message: "Could not fetch resources.",
            error: err.message
        });
    }
};
