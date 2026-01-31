const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/session.controller');
const { authenticateJWT, optionalAuth } = require('../middleware/auth');

// Create session (requires auth)
router.post('/', authenticateJWT, sessionController.createSession);

// Get user's sessions
router.get('/my-sessions', authenticateJWT, sessionController.getUserSessions);

// Get session by invite code (public)
router.get('/invite/:inviteCode', sessionController.getSessionByInvite);

// Get session by ID
router.get('/:sessionId', optionalAuth, sessionController.getSession);

// Get session history
router.get('/:sessionId/history', optionalAuth, sessionController.getSessionHistory);

// Delete session
router.delete('/:sessionId', authenticateJWT, sessionController.deleteSession);

module.exports = router;
