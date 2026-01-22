/**
 * User model
 * Handles all database operations related to users
 */

const db = require('../config/database');

/**
 * Create a new user
 * @param {string} username - Unique username
 * @param {string} email - Unique email
 * @param {string} passwordHash - Hashed password
 * @returns {Object} Created user object (without password_hash)
 */
function createUser(username, email, passwordHash) {
  try {
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, profile_picture_url)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(username, email, passwordHash, null);
    
    // Return user without password_hash
    return {
      id: result.lastInsertRowid,
      username,
      email,
      profile_picture_url: null,
      created_at: new Date().toISOString()
    };
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error('Username or email already exists');
    }
    throw error;
  }
}

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Object|null} User object or null if not found
 */
function findByEmail(email) {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email) || null;
}

/**
 * Find user by username
 * @param {string} username - Username
 * @returns {Object|null} User object or null if not found
 */
function findByUsername(username) {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username) || null;
}

/**
 * Find user by ID
 * @param {number} id - User ID
 * @returns {Object|null} User object (without password_hash) or null if not found
 */
function findById(id) {
  const stmt = db.prepare('SELECT id, username, email, profile_picture_url, created_at FROM users WHERE id = ?');
  return stmt.get(id) || null;
}

/**
 * Find user by email or username
 * Used for login when user can login with either email or username
 * @param {string} identifier - Email or username
 * @returns {Object|null} User object or null if not found
 */
function findByEmailOrUsername(identifier) {
  const stmt = db.prepare('SELECT id, username, email, password_hash, profile_picture_url, created_at FROM users WHERE email = ? OR username = ?');
  return stmt.get(identifier, identifier) || null;
}

/**
 * Check if email exists
 * @param {string} email - Email to check
 * @returns {boolean} True if email exists
 */
function emailExists(email) {
  const stmt = db.prepare('SELECT 1 FROM users WHERE email = ? LIMIT 1');
  return !!stmt.get(email);
}

/**
 * Check if username exists
 * @param {string} username - Username to check
 * @returns {boolean} True if username exists
 */
function usernameExists(username) {
  const stmt = db.prepare('SELECT 1 FROM users WHERE username = ? LIMIT 1');
  return !!stmt.get(username);
}

/**
 * Search users by username (partial match)
 * Excludes the current user from results
 * @param {string} searchTerm - Partial username to search for
 * @param {number} currentUserId - ID of current user to exclude
 * @param {number} limit - Maximum number of results (default: 20)
 * @returns {Array} Array of user objects with id and username only
 */
function searchUsers(searchTerm, currentUserId, limit = 20) {
  const stmt = db.prepare(`
    SELECT id, username, profile_picture_url
    FROM users 
    WHERE username LIKE ? 
      AND id != ?
    LIMIT ?
  `);
  
  // Use LIKE with wildcards for partial matching
  const searchPattern = `%${searchTerm}%`;
  return stmt.all(searchPattern, currentUserId, limit);
}

/**
 * Update user profile picture
 * @param {number} userId - User ID
 * @param {string} profilePictureUrl - URL to profile picture
 * @returns {Object|null} Updated user object or null if not found
 */
function updateProfilePicture(userId, profilePictureUrl) {
  const stmt = db.prepare(`
    UPDATE users 
    SET profile_picture_url = ?
    WHERE id = ?
  `);
  
  const result = stmt.run(profilePictureUrl, userId);
  
  if (result.changes === 0) {
    return null;
  }
  
  return findById(userId);
}

module.exports = {
  createUser,
  findByEmail,
  findByUsername,
  findById,
  findByEmailOrUsername,
  emailExists,
  usernameExists,
  searchUsers,
  updateProfilePicture
};

