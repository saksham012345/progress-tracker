const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');
const sessionController = require('../controllers/sessionController');
const reminderController = require('../controllers/reminderController');
const noteController = require('../controllers/noteController');
const resourceController = require('../controllers/resourceController');

const { validateTopic, validateSession } = require('../middleware/validation');
const workspaceController = require('../controllers/workspaceController');
const planController = require('../controllers/planController');
const auth = require('../middleware/auth'); // Assuming auth middleware exists

// Topic Routes
router.get('/topics', topicController.getTopics);
router.post('/topics', auth, validateTopic, topicController.createTopic);
router.delete('/topics/:id', topicController.deleteTopic);
router.patch('/topics/:id/status', auth, topicController.updateTopicStatus);

// Session Routes
router.get('/sessions', sessionController.getAllSessions);
router.get('/sessions/:topicId', sessionController.getSessions);
router.post('/sessions', validateSession, sessionController.addSession);

const aiController = require('../controllers/aiController');

// AI Routes
router.post('/ai/summarize', aiController.summarizeProgress);
router.post('/ai/improve-notes', aiController.improveNotes);
router.post('/ai/plan', aiController.generateStudyPlan);
router.post('/ai/chat', aiController.chat);
router.post('/ai/decompose', aiController.decomposeTask);
router.get('/ai/resources', aiController.getResources);
router.post('/ai/resources', aiController.addResource);

// Workspace Routes
router.get('/workspaces', auth, workspaceController.getWorkspaces);
router.post('/workspaces', auth, workspaceController.createWorkspace);
router.post('/workspaces/:id/members', auth, workspaceController.addMember);
router.get('/workspaces/:id/chat', auth, workspaceController.getChatHistory);

// Reminder Routes
router.get('/reminders', auth, reminderController.getReminders);
router.post('/reminders', auth, reminderController.createReminder);
router.delete('/reminders/:id', auth, reminderController.deleteReminder);
router.patch('/reminders/:id/trigger', auth, reminderController.markAsTriggered);

// Note Routes
router.get('/workspaces/:workspaceId/notes', auth, noteController.getNotes);
router.post('/notes', auth, noteController.updateNote);
router.delete('/notes/:id', auth, noteController.deleteNote);

// Resource Routes
router.get('/workspaces/:workspaceId/resources', auth, resourceController.getResources);
router.post('/resources', auth, resourceController.addResource);
router.delete('/resources/:id', auth, resourceController.deleteResource);
// Saved Plans Routes
router.get('/plans', auth, planController.getPlans);
router.post('/plans', auth, planController.savePlan);
router.delete('/plans/:id', auth, planController.deletePlan);

module.exports = router;
