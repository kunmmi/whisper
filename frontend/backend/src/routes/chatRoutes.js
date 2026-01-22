/**
 * Chat routes
 * Handles chat-related endpoints
 */

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/chats/private
 * Create a private chat between two users
 * Body: { username: "otheruser" }
 */
router.post('/private', authenticateToken, chatController.createPrivateChat);

/**
 * GET /api/chats
 * Get all chats for the authenticated user
 */
router.get('/', authenticateToken, chatController.getUserChats);

/**
 * POST /api/chats/group
 * Create a group chat
 * Body: { name: "Group Name", usernames: ["user1", "user2"] }
 */
router.post('/group', authenticateToken, chatController.createGroup);

/**
 * POST /api/chats/:chatId/add-user
 * Add user to group (admin only)
 * Body: { username: "username" }
 */
router.post('/:chatId/add-user', authenticateToken, chatController.addUserToGroup);

/**
 * POST /api/chats/:chatId/remove-user
 * Remove user from group (admin only, cannot remove last admin)
 * Body: { username: "username" }
 */
router.post('/:chatId/remove-user', authenticateToken, chatController.removeUserFromGroup);

/**
 * POST /api/chats/:chatId/leave
 * Leave group (any member, but not if last admin)
 */
router.post('/:chatId/leave', authenticateToken, chatController.leaveGroup);

/**
 * PUT /api/chats/:chatId/rename
 * Rename group (admin only)
 * Body: { name: "New Name" }
 */
router.put('/:chatId/rename', authenticateToken, chatController.renameGroup);

/**
 * DELETE /api/chats/:chatId
 * Delete a chat (remove user from chat)
 * For private chats: removes user from chat
 * For group chats: removes user from group (cannot be last admin)
 */
router.delete('/:chatId', authenticateToken, chatController.deleteChat);

module.exports = router;

