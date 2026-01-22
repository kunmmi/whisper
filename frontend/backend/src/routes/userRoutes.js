/**
 * User routes
 * Handles user-related endpoints
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/users/search?username=
 * Search users by username (partial match)
 * Protected route - requires authentication
 */
router.get('/search', authenticateToken, userController.searchUsers);

/**
 * GET /api/users/online-status?userIds=1,2,3
 * Get online status for multiple users (query param: userIds=1,2,3)
 * Protected route - requires authentication
 * NOTE: This route must come before /online-status/:userId to avoid route conflicts
 */
router.get('/online-status', authenticateToken, userController.getOnlineStatuses);

/**
 * GET /api/users/online-status/:userId
 * Get online status for a user
 * Protected route - requires authentication
 */
router.get('/online-status/:userId', authenticateToken, userController.getOnlineStatus);

/**
 * PUT /api/users/profile-picture
 * Update user's profile picture
 * Body: { profile_picture_url: "https://..." }
 * Protected route - requires authentication
 */
router.put('/profile-picture', authenticateToken, userController.updateProfilePicture);

module.exports = router;

