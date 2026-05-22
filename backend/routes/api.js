const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validateTopic, validateSession } = require('../middleware/validation');

const topicController = require('../controllers/topicController');
const sessionController = require('../controllers/sessionController');
const reminderController = require('../controllers/reminderController');
const noteController = require('../controllers/noteController');
const resourceController = require('../controllers/resourceController');
const workspaceController = require('../controllers/workspaceController');
const planController = require('../controllers/planController');
const aiController = require('../controllers/aiController');
const quizController = require('../controllers/quizController');

// ── Topic Routes ──────────────────────────────────────────────
router.get('/topics/due-review', auth, topicController.getDueReviews);  // MUST be before /:id
router.get('/topics', auth, topicController.getTopics);
router.get('/topics/:id', auth, topicController.getTopic);
router.post('/topics', auth, validateTopic, topicController.createTopic);
router.put('/topics/:id', auth, topicController.updateTopic);
router.delete('/topics/:id', auth, topicController.deleteTopic);
router.patch('/topics/:id/status', auth, topicController.updateTopicStatus);

// ── Session Routes ────────────────────────────────────────────
router.get('/sessions', auth, sessionController.getAllSessions);
router.get('/sessions/:topicId', sessionController.getSessions);
router.post('/sessions', auth, validateSession, sessionController.addSession);
router.patch('/sessions/:id/notes', auth, sessionController.updateSessionNotes);
router.delete('/sessions/:id', auth, sessionController.deleteSession);

// ── AI Routes ─────────────────────────────────────────────────
router.post('/ai/summarize', auth, aiController.summarizeProgress);
router.post('/ai/improve-notes', aiController.improveNotes);
router.post('/ai/plan', aiController.generateStudyPlan);
router.post('/ai/chat', auth, aiController.chat);
router.post('/ai/decompose', aiController.decomposeTask);
router.get('/ai/resources', aiController.getResources);
router.post('/ai/resources', aiController.addResource);
router.get('/ai/chat-history', auth, aiController.getChatHistory);
router.delete('/ai/chat-history', auth, aiController.clearChatHistory);
router.get('/ai/weekly-report', auth, aiController.weeklyReport);

// ── Quiz / AI Tutor Routes ────────────────────────────────────
router.post('/quiz/generate', auth, quizController.generateQuiz);
router.post('/quiz/submit', auth, quizController.submitQuiz);
router.get('/quiz/history/:topicId', auth, quizController.getQuizHistory);

// ── Workspace Routes ──────────────────────────────────────────
router.get('/workspaces', auth, workspaceController.getWorkspaces);
router.post('/workspaces', auth, workspaceController.createWorkspace);
router.post('/workspaces/:id/members', auth, workspaceController.addMember);
router.get('/workspaces/:id/chat', auth, workspaceController.getChatHistory);

// ── Reminder Routes ───────────────────────────────────────────
router.get('/reminders', auth, reminderController.getReminders);
router.post('/reminders', auth, reminderController.createReminder);
router.delete('/reminders/:id', auth, reminderController.deleteReminder);
router.patch('/reminders/:id/trigger', auth, reminderController.markAsTriggered);

// ── Note Routes ───────────────────────────────────────────────
router.get('/workspaces/:workspaceId/notes', auth, noteController.getNotes);
router.post('/notes', auth, noteController.updateNote);
router.delete('/notes/:id', auth, noteController.deleteNote);

// ── Resource Routes ───────────────────────────────────────────
router.get('/workspaces/:workspaceId/resources', auth, resourceController.getResources);
router.post('/resources', auth, resourceController.addResource);
router.delete('/resources/:id', auth, resourceController.deleteResource);

// ── Plan Routes ───────────────────────────────────────────────
router.get('/plans', auth, planController.getPlans);
router.post('/plans', auth, planController.savePlan);
router.delete('/plans/:id', auth, planController.deletePlan);

module.exports = router;
