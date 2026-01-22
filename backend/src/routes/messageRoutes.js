/**
 * Message routes
 * Handles message-related endpoints
 */

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/messages/:chatId
 * Get messages for a chat with pagination
 * Query params: limit (optional), offset (optional)
 */
router.get('/:chatId', authenticateToken, messageController.getMessages);

/**
 * POST /api/messages/:chatId
 * Send a message to a chat
 * Body: { content: "Hello" }
 */
router.post('/:chatId', authenticateToken, messageController.sendMessage);

/**
 * POST /api/messages/:chatId/read
 * Mark messages as read for a chat
 */
router.post('/:chatId/read', authenticateToken, messageController.markAsRead);

module.exports = router;

