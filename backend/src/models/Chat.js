/**
 * Chat model
 * Handles all database operations related to chats
 */

const db = require('../config/database');

/**
 * Create a new chat
 * @param {boolean} isGroup - Whether this is a group chat
 * @param {string|null} name - Chat name (null for private chats)
 * @returns {Object} Created chat object
 */
function createChat(isGroup = false, name = null) {
  const stmt = db.prepare(`
    INSERT INTO chats (is_group, name)
    VALUES (?, ?)
  `);
  
  const result = stmt.run(isGroup ? 1 : 0, name);
  
  return {
    id: result.lastInsertRowid,
    is_group: isGroup,
    name,
    created_at: new Date().toISOString()
  };
}

/**
 * Add a member to a chat
 * @param {number} chatId - Chat ID
 * @param {number} userId - User ID
 * @param {string} role - Member role ('admin' or 'member')
 */
function addMember(chatId, userId, role = 'member') {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO chat_members (chat_id, user_id, role)
    VALUES (?, ?, ?)
  `);
  
  stmt.run(chatId, userId, role);
}

/**
 * Find chat by ID
 * @param {number} chatId - Chat ID
 * @returns {Object|null} Chat object or null if not found
 */
function findChatById(chatId) {
  const stmt = db.prepare('SELECT * FROM chats WHERE id = ?');
  return stmt.get(chatId) || null;
}

/**
 * Find private chat between two users
 * @param {number} userId1 - First user ID
 * @param {number} userId2 - Second user ID
 * @returns {Object|null} Chat object or null if not found
 */
function findPrivateChatBetweenUsers(userId1, userId2) {
  const stmt = db.prepare(`
    SELECT c.* 
    FROM chats c
    INNER JOIN chat_members cm1 ON c.id = cm1.chat_id
    INNER JOIN chat_members cm2 ON c.id = cm2.chat_id
    WHERE c.is_group = 0
      AND cm1.user_id = ?
      AND cm2.user_id = ?
      AND cm1.user_id != cm2.user_id
    LIMIT 1
  `);
  
  return stmt.get(userId1, userId2) || null;
}

/**
 * Get all chats for a user with metadata
 * @param {number} userId - User ID
 * @returns {Array} Array of chat objects with metadata
 */
function getUserChats(userId) {
  const stmt = db.prepare(`
    SELECT DISTINCT c.*
    FROM chats c
    INNER JOIN chat_members cm ON c.id = cm.chat_id
    WHERE cm.user_id = ?
    ORDER BY c.created_at DESC
  `);
  
  return stmt.all(userId);
}

/**
 * Get chat members
 * @param {number} chatId - Chat ID
 * @returns {Array} Array of member objects with user info
 */
function getChatMembers(chatId) {
  const stmt = db.prepare(`
    SELECT cm.user_id, cm.role, u.username, u.email, u.profile_picture_url
    FROM chat_members cm
    INNER JOIN users u ON cm.user_id = u.id
    WHERE cm.chat_id = ?
  `);
  
  return stmt.all(chatId);
}

/**
 * Check if user is a member of a chat
 * @param {number} chatId - Chat ID
 * @param {number} userId - User ID
 * @returns {boolean} True if user is a member
 */
function isUserMember(chatId, userId) {
  const stmt = db.prepare('SELECT 1 FROM chat_members WHERE chat_id = ? AND user_id = ? LIMIT 1');
  return !!stmt.get(chatId, userId);
}

/**
 * Get other participant in private chat
 * @param {number} chatId - Chat ID
 * @param {number} currentUserId - Current user ID
 * @returns {Object|null} Other user object or null
 */
function getOtherParticipant(chatId, currentUserId) {
  const stmt = db.prepare(`
    SELECT u.id, u.username, u.email, u.profile_picture_url
    FROM chat_members cm
    INNER JOIN users u ON cm.user_id = u.id
    WHERE cm.chat_id = ? AND cm.user_id != ?
    LIMIT 1
  `);
  
  return stmt.get(chatId, currentUserId) || null;
}

/**
 * Get group members with roles
 * @param {number} chatId - Chat ID
 * @returns {Array} Array of member objects with user info and roles
 */
function getGroupMembers(chatId) {
  return getChatMembers(chatId);
}

/**
 * Get count of admins in a group
 * @param {number} chatId - Chat ID
 * @returns {number} Number of admins
 */
function getAdminCount(chatId) {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM chat_members
    WHERE chat_id = ? AND role = 'admin'
  `);
  
  const result = stmt.get(chatId);
  return result ? result.count : 0;
}

/**
 * Check if user is an admin of a chat
 * @param {number} chatId - Chat ID
 * @param {number} userId - User ID
 * @returns {boolean} True if user is admin
 */
function isUserAdmin(chatId, userId) {
  const stmt = db.prepare(`
    SELECT 1 FROM chat_members 
    WHERE chat_id = ? AND user_id = ? AND role = 'admin'
    LIMIT 1
  `);
  
  return !!stmt.get(chatId, userId);
}

/**
 * Get user's role in a chat
 * @param {number} chatId - Chat ID
 * @param {number} userId - User ID
 * @returns {string|null} Role ('admin' or 'member') or null if not a member
 */
function getUserRole(chatId, userId) {
  const stmt = db.prepare(`
    SELECT role FROM chat_members
    WHERE chat_id = ? AND user_id = ?
  `);
  
  const result = stmt.get(chatId, userId);
  return result ? result.role : null;
}

/**
 * Remove a member from a chat
 * @param {number} chatId - Chat ID
 * @param {number} userId - User ID to remove
 */
function removeMember(chatId, userId) {
  const stmt = db.prepare(`
    DELETE FROM chat_members
    WHERE chat_id = ? AND user_id = ?
  `);
  
  stmt.run(chatId, userId);
}

/**
 * Update group name
 * @param {number} chatId - Chat ID
 * @param {string} name - New group name
 */
function updateGroupName(chatId, name) {
  const stmt = db.prepare(`
    UPDATE chats
    SET name = ?
    WHERE id = ?
  `);
  
  stmt.run(name, chatId);
}

/**
 * Get member count for a chat
 * @param {number} chatId - Chat ID
 * @returns {number} Number of members
 */
function getMemberCount(chatId) {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM chat_members
    WHERE chat_id = ?
  `);
  
  const result = stmt.get(chatId);
  return result ? result.count : 0;
}

module.exports = {
  createChat,
  addMember,
  findChatById,
  findPrivateChatBetweenUsers,
  getUserChats,
  getChatMembers,
  isUserMember,
  getOtherParticipant,
  getGroupMembers,
  getAdminCount,
  isUserAdmin,
  getUserRole,
  removeMember,
  updateGroupName,
  getMemberCount
};

