const axios = require('axios');
const Quiz = require('../models/Quiz');
const Topic = require('../models/Topic');
const Session = require('../models/Session');
const User = require('../models/User');

let AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
if (!AI_SERVICE_URL.startsWith('http')) AI_SERVICE_URL = `https://${AI_SERVICE_URL}`;

// Quiz needs a longer timeout — phi3 generating 5 questions takes 60-120s
const aiClient = axios.create({ baseURL: AI_SERVICE_URL, timeout: 180000 });

// POST /api/quiz/generate — generate quiz questions from topic notes
exports.generateQuiz = async (req, res) => {
    try {
        const { topicId } = req.body;
        const topic = await Topic.findOne({ _id: topicId, userId: req.user.id });
        if (!topic) return res.status(404).json({ message: 'Topic not found' });

        const sessions = await Session.find({ topicId }).sort({ date: -1 }).limit(5);
        const notesContext = sessions.map(s => s.notes).join('\n\n');

        const response = await aiClient.post('/rag/quiz', {
            topic: topic.title,
            notes: notesContext,
            difficulty: topic.difficulty || 'Medium'
        });

        res.json(response.data);
    } catch (err) {
        console.error('Quiz generate error:', err.message);
        res.status(502).json({ message: 'AI service unavailable', error: err.message });
    }
};

// POST /api/quiz/submit — grade answers and award XP
exports.submitQuiz = async (req, res) => {
    try {
        const { topicId, questions } = req.body;
        // questions: [{ question, userAnswer, correctAnswer }]

        const topic = await Topic.findOne({ _id: topicId, userId: req.user.id });
        if (!topic) return res.status(404).json({ message: 'Topic not found' });

        // Grade via AI
        const response = await aiClient.post('/rag/grade', { questions });
        const graded = response.data.graded; // [{ ...q, isCorrect, feedback }]

        const correct = graded.filter(q => q.isCorrect).length;
        const score = Math.round((correct / graded.length) * 100);
        const xpEarned = correct * 10;

        const quiz = new Quiz({
            userId: req.user.id,
            topicId,
            questions: graded.map(q => ({
                question: q.question,
                userAnswer: q.userAnswer,
                correctAnswer: q.correctAnswer,
                isCorrect: q.isCorrect,
                xpAwarded: q.isCorrect ? 10 : 0
            })),
            score,
            xpEarned
        });
        await quiz.save();

        // Award XP
        const user = await User.findById(req.user.id);
        if (user) {
            user.points += xpEarned;
            user.level = Math.floor(user.points / 200) + 1;
            if (score === 100) {
                const already = user.badges.some(b => b.name === 'Perfect Score');
                if (!already) user.badges.push({ name: 'Perfect Score', icon: '💯' });
            }
            await user.save();
        }

        res.json({ quiz, score, xpEarned, graded });
    } catch (err) {
        console.error('Quiz submit error:', err.message);
        res.status(502).json({ message: 'AI service unavailable', error: err.message });
    }
};

// GET /api/quiz/history/:topicId
exports.getQuizHistory = async (req, res) => {
    try {
        const quizzes = await Quiz.find({ userId: req.user.id, topicId: req.params.topicId })
            .sort({ completedAt: -1 })
            .limit(10);
        res.json(quizzes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
