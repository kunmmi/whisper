/**
 * User controller
 * Handles user-related operations like searching
 */

const User = require('../models/User');
const { isUserOnline, getOnlineUsers } = require('../config/socket');

/**
 * Search users by username
 * GET /api/users/search?username=
 * Protected route - requires authentication
 */
function searchUsers(req, res) {
  try {
    const { username } = req.query;
    const currentUserId = req.user.id; // From auth middleware

    // Validate query parameter
    if (!username || username.trim() === '') {
      return res.status(400).json({ error: 'Username query parameter is required' });
    }

    // Search users (excludes current user)
    const results = User.searchUsers(username.trim(), currentUserId, 20);

    res.json({
      users: results,
      count: results.length
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
}

/**
 * Get online status for a single user
 * GET /api/users/online-status/:userId
 */
function getOnlineStatus(req, res) {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);

    if (!userIdInt) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Check if user exists
    const user = User.findById(userIdInt);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isOnline = isUserOnline(userIdInt);

    res.json({
      userId: userIdInt,
      username: user.username,
      isOnline
    });
  } catch (error) {
    console.error('Get online status error:', error);
    res.status(500).json({ error: 'Failed to get online status' });
  }
}

/**
 * Get online status for multiple users
 * GET /api/users/online-status?userIds=1,2,3
 */
function getOnlineStatuses(req, res) {
  try {
    const { userIds } = req.query;

    if (!userIds) {
      return res.status(400).json({ error: 'userIds query parameter is required' });
    }

    const userIdArray = userIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    const onlineUsersArray = getOnlineUsers();
    const onlineUsersSet = new Set(onlineUsersArray);
    
    console.log('Online users:', onlineUsersArray);
    console.log('Requested user IDs:', userIdArray);

    const statuses = userIdArray.map(userId => {
      const user = User.findById(userId);
      const isOnline = onlineUsersSet.has(userId);
      console.log(`User ${userId} (${user?.username}): ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
      return {
        userId,
        username: user ? user.username : null,
        isOnline
      };
    });

    res.json({
      statuses,
      count: statuses.length
    });
  } catch (error) {
    console.error('Get online statuses error:', error);
    res.status(500).json({ error: 'Failed to get online statuses' });
  }
}

/**
 * Update user profile picture
 * PUT /api/users/profile-picture
 * Body: { profile_picture_url: "https://..." }
 */
function updateProfilePicture(req, res) {
  try {
    const { profile_picture_url } = req.body;
    const userId = req.user.id;

    console.log('Update profile picture request:', { userId, hasUrl: !!profile_picture_url, urlLength: profile_picture_url?.length });

    // Validate URL format (basic validation)
    // Allow null, empty string, or valid string
    if (profile_picture_url !== null && profile_picture_url !== undefined && typeof profile_picture_url !== 'string') {
      return res.status(400).json({ error: 'Invalid profile picture URL format' });
    }

    // Convert empty string to null
    let pictureUrl = profile_picture_url === '' ? null : (profile_picture_url || null);
    
    // Validate length if it's a base64 data URL (can be very long)
    if (pictureUrl && pictureUrl.length > 1000000) { // 1MB limit
      return res.status(400).json({ error: 'Profile picture is too large (max 1MB)' });
    }

    // Update profile picture
    const updatedUser = User.updateProfilePicture(userId, pictureUrl);

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Profile picture updated successfully for user:', userId);

    res.json({
      message: 'Profile picture updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        profile_picture_url: updatedUser.profile_picture_url,
        created_at: updatedUser.created_at
      }
    });
  } catch (error) {
    console.error('Update profile picture error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to update profile picture', details: error.message });
  }
}

module.exports = {
  searchUsers,
  getOnlineStatus,
  getOnlineStatuses,
  updateProfilePicture
};

