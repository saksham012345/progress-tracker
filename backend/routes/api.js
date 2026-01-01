const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');
const sessionController = require('../controllers/sessionController');

const { validateTopic, validateSession } = require('../middleware/validation');

// Topic Routes
router.get('/topics', topicController.getTopics);
router.post('/topics', validateTopic, topicController.createTopic);
router.delete('/topics/:id', topicController.deleteTopic);
router.patch('/topics/:id/status', topicController.updateTopicStatus);

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
router.get('/ai/resources', aiController.getResources);
router.post('/ai/resources', aiController.addResource);

module.exports = router;
