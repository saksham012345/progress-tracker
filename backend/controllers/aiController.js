const axios = require('axios');
const Topic = require('../models/Topic');
const Session = require('../models/Session');
const Note = require('../models/Note');
const Resource = require('../models/Resource');
const User = require('../models/User');

// Priority: Render env var > .env > fallback
let AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// If URL doesn't include http, add https (for Render service URLs like "service-name.onrender.com")
if (AI_SERVICE_URL && !AI_SERVICE_URL.startsWith('http')) {
    AI_SERVICE_URL = `https://${AI_SERVICE_URL}`;
}

console.log(`🤖 AI Service URL configured as: ${AI_SERVICE_URL}`);

// Reduced timeout from 180s to 30s for faster failure detection
const aiClient = axios.create({ 
    baseURL: AI_SERVICE_URL, 
    timeout: 30000,
    validateStatus: () => true  // Don't throw on any status code
});

const handleAiError = (res, err) => {
    console.error('❌ AI Service Error:', err.message);
    
    if (err.response) {
        console.error(`   Response Status: ${err.response.status}`);
        console.error(`   Response Data: ${JSON.stringify(err.response.data).substring(0, 200)}`);
        return res.status(err.response.status).json(err.response.data);
    }
    
    if (err.code === 'ECONNREFUSED') {
        console.error(`   Connection Refused - AI service not accessible at ${AI_SERVICE_URL}`);
        return res.status(503).json({ 
            message: `Cannot reach AI service at ${AI_SERVICE_URL}. Check if service is running.`,
            retryAfter: 60
        });
    }
    
    if (err.code === 'ENOTFOUND') {
        console.error(`   Host not found - ${AI_SERVICE_URL}`);
        return res.status(503).json({ 
            message: 'AI service host not found. Configuration error.',
            retryAfter: 60
        });
    }
    
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        console.error(`   Request Timeout after ${err.config?.timeout}ms`);
        return res.status(503).json({ 
            message: 'AI Service is busy or waking up. Please try again in 30-60 seconds.',
            retryAfter: 60
        });
    }
    
    if (err.request) {
        console.error(`   No response received from AI service`);
        return res.status(503).json({ 
            message: 'AI Service unavailable. It may be starting up. Please try again in 30-60 seconds.',
            retryAfter: 60
        });
    }
    
    console.error(`   Other error: ${err.code}`);
    return res.status(502).json({ 
        message: 'AI Service Connection Error. Please try again shortly.',
        error: err.message 
    });
};

exports.summarizeProgress = async (req, res) => {
    try {
        const userId = req.user?.id;
        const topics = userId ? await Topic.find({ userId }) : [];
        const topicIds = topics.map(t => t._id);
        const sessions = await Session.find({ topicId: { $in: topicIds } });

        const userQuery = req.body.query || 'Summarize my progress';
        const workspaceId = req.body.workspaceId;
        let notes = [], resources = [];
        if (workspaceId) {
            notes = await Note.find({ workspaceId });
            resources = await Resource.find({ workspaceId });
        }

        const response = await aiClient.post('/rag/analyze', { topics, sessions, notes, resources, query: userQuery });
        res.json(response.data);
    } catch (err) {
        handleAiError(res, err);
    }
};

exports.improveNotes = async (req, res) => {
    const { notes, topic } = req.body;
    if (!notes) return res.status(400).json({ message: 'Notes are required' });
    try {
        const response = await aiClient.post('/rag/improve-notes', { notes, topic: topic || 'General' });
        res.json(response.data);
    } catch (err) {
        handleAiError(res, err);
    }
};

// Persistent chat with user memory
exports.chat = async (req, res) => {
    try {
        const { message, history, workspaceId } = req.body;
        const userId = req.user?.id;

        let notes = [], resources = [], userContext = '';
        if (workspaceId) {
            notes = await Note.find({ workspaceId });
            resources = await Resource.find({ workspaceId });
        }

        // Build coach memory context from user's actual data
        if (userId) {
            const topics = await Topic.find({ userId }).sort({ createdAt: -1 }).limit(20);
            const recentSessions = await Session.find({
                topicId: { $in: topics.map(t => t._id) }
            }).sort({ date: -1 }).limit(10).populate('topicId', 'title');

            const dueTopics = topics.filter(t => t.nextReviewDate && new Date(t.nextReviewDate) <= new Date());

            userContext = `User's learning context:
Topics: ${topics.map(t => `${t.title} (${t.status}, ${t.totalStudyMinutes || 0} mins studied)`).join(', ')}
Recent sessions: ${recentSessions.map(s => `${s.topicId?.title || 'Unknown'} for ${s.duration}min`).join(', ')}
Due for review: ${dueTopics.map(t => t.title).join(', ') || 'None'}`;
        }

        // Use persisted history from DB if no history provided
        let chatHistory = history || [];
        if (userId && chatHistory.length === 0) {
            const user = await User.findById(userId).select('chatHistory');
            if (user?.chatHistory?.length > 0) {
                chatHistory = user.chatHistory.slice(-20).map(m => ({ role: m.role, content: m.content }));
            }
        }

        const response = await aiClient.post('/rag/chat', {
            message,
            history: chatHistory,
            notes,
            resources,
            user_context: userContext
        });

        // Persist chat history
        if (userId) {
            await User.findByIdAndUpdate(userId, {
                $push: {
                    chatHistory: {
                        $each: [
                            { role: 'user', content: message },
                            { role: 'assistant', content: response.data.reply }
                        ],
                        $slice: -100 // keep last 100 messages
                    }
                }
            });
        }

        res.json(response.data);
    } catch (err) {
        handleAiError(res, err);
    }
};

exports.generateStudyPlan = async (req, res) => {
    console.log(`📋 [AI] Plan generation request received`);
    console.log(`   Payload: ${JSON.stringify(req.body).substring(0, 100)}`);
    
    try {
        const { topics, goals, hours } = req.body;
        
        if (!topics || !Array.isArray(topics) || topics.length === 0) {
            return res.status(400).json({ message: 'Topics array is required and must not be empty' });
        }

        console.log(`   Sending to AI Service: ${AI_SERVICE_URL}/rag/plan`);
        const response = await aiClient.post('/rag/plan', {
            topics,
            goals: goals || 'General learning',
            hours_per_week: parseInt(hours) || 10
        });
        
        console.log(`   AI Response status: ${response.status}`);
        
        if (response.status !== 200) {
            console.error(`   ❌ AI Service returned ${response.status}:`, response.data);
            return handleAiError(res, { 
                response: { status: response.status, data: response.data },
                message: `AI Service error: ${response.status}`
            });
        }
        
        if (!response.data.plan) {
            console.warn(`   ⚠️ AI returned no plan data`);
            return res.status(500).json({ message: 'AI service generated empty response' });
        }
        
        console.log(`   ✅ Plan generated successfully (${response.data.plan.length} chars)`);
        res.json(response.data);
    } catch (err) {
        console.error(`   ❌ Exception:`, err.message);
        console.error(`   Code: ${err.code}, Status: ${err.response?.status}`);
        handleAiError(res, err);
    }
};

exports.decomposeTask = async (req, res) => {
    try {
        const { task, context } = req.body;
        if (!task) return res.status(400).json({ message: 'Task is required' });
        const response = await aiClient.post('/rag/decompose', { task, context: context || '' });
        res.json(response.data);
    } catch (err) {
        handleAiError(res, err);
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
        const response = await aiClient.post('/rag/knowledge', { category, content });
        res.json(response.data);
    } catch (err) {
        handleAiError(res, err);
    }
};

// GET /api/ai/chat-history — load persisted chat history
exports.getChatHistory = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('chatHistory');
        res.json(user?.chatHistory?.slice(-50) || []);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/ai/chat-history — clear chat history
exports.clearChatHistory = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, { $set: { chatHistory: [] } });
        res.json({ message: 'Chat history cleared' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/ai/weekly-report — AI-generated weekly progress report
exports.weeklyReport = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('-password');
        const topics = await Topic.find({ userId });
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const sessions = await Session.find({
            topicId: { $in: topics.map(t => t._id) },
            date: { $gte: oneWeekAgo }
        }).populate('topicId', 'title');

        const totalMins = sessions.reduce((sum, s) => sum + s.duration, 0);
        const dueTopics = topics.filter(t => t.nextReviewDate && new Date(t.nextReviewDate) <= new Date());

        const response = await aiClient.post('/rag/analyze', {
            topics,
            sessions,
            query: `Generate a weekly progress report. The user studied ${totalMins} minutes this week across ${sessions.length} sessions. 
They have ${dueTopics.length} topics due for review. Their streak is ${user.streak} days. 
Provide: 1) Summary of this week 2) What to focus on next week 3) Motivational insight. Keep it concise and personal.`
        });

        res.json({
            report: response.data.summary || response.data.analysis,
            stats: {
                totalMinutes: totalMins,
                sessionCount: sessions.length,
                streak: user.streak,
                level: user.level,
                points: user.points,
                dueReviews: dueTopics.length
            }
        });
    } catch (err) {
        handleAiError(res, err);
    }
};
