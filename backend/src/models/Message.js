/**
 * Message model
 * Handles all database operations related to messages
 */

const db = require('../config/database');

/**
 * Create a new message
 * @param {number} chatId - Chat ID
 * @param {number} senderId - Sender user ID
 * @param {string} content - Message content
 * @param {number|null} replyToMessageId - ID of message being replied to (optional)
 * @param {string|null} mediaUrl - URL or base64 data URL of media (optional)
 * @param {string|null} mediaType - Type of media: 'image', 'video', 'file' (optional)
 * @returns {Object} Created message object
 */
function createMessage(chatId, senderId, content, replyToMessageId = null, mediaUrl = null, mediaType = null) {
  const stmt = db.prepare(`
    INSERT INTO messages (chat_id, sender_id, content, reply_to_message_id, media_url, media_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(chatId, senderId, content, replyToMessageId, mediaUrl, mediaType);
  
  return {
    id: result.lastInsertRowid,
    chat_id: chatId,
    sender_id: senderId,
    content,
    reply_to_message_id: replyToMessageId,
    media_url: mediaUrl,
    media_type: mediaType,
    timestamp: new Date().toISOString()
  };
}

/**
 * Get a message by ID
 * @param {number} messageId - Message ID
 * @returns {Object|null} Message object or null if not found
 */
function findMessageById(messageId) {
  const stmt = db.prepare(`
    SELECT 
      m.id,
      m.chat_id,
      m.sender_id,
      m.content,
      m.reply_to_message_id,
      m.media_url,
      m.media_type,
      m.timestamp,
      u.username as sender_username,
      u.profile_picture_url as sender_profile_picture_url
    FROM messages m
    INNER JOIN users u ON m.sender_id = u.id
    WHERE m.id = ?
  `);
  
  const msg = stmt.get(messageId);
  
  if (!msg) {
    return null;
  }
  
  const messageObj = {
    id: msg.id,
    chatId: msg.chat_id,
    sender: {
      id: msg.sender_id,
      username: msg.sender_username,
      profile_picture_url: msg.sender_profile_picture_url
    },
    content: msg.content,
    reply_to_message_id: msg.reply_to_message_id,
    timestamp: msg.timestamp
  };
  
  // Add media information if present
  if (msg.media_url && msg.media_type) {
    messageObj.media = {
      url: msg.media_url,
      type: msg.media_type
    };
  }
  
  return messageObj;
}

/**
 * Get messages for a chat with pagination
 * @param {number} chatId - Chat ID
 * @param {number} limit - Maximum number of messages
 * @param {number} offset - Offset for pagination
 * @returns {Array} Array of message objects with sender info
 */
function getMessagesByChatId(chatId, limit = 50, offset = 0) {
  const stmt = db.prepare(`
    SELECT 
      m.id,
      m.chat_id,
      m.sender_id,
      m.content,
      m.reply_to_message_id,
      m.media_url,
      m.media_type,
      m.timestamp,
      u.username as sender_username,
      u.profile_picture_url as sender_profile_picture_url,
      reply_msg.id as reply_message_id,
      reply_msg.content as reply_message_content,
      reply_msg.sender_id as reply_message_sender_id,
      reply_user.username as reply_message_sender_username,
      reply_user.profile_picture_url as reply_message_sender_profile_picture_url
    FROM messages m
    INNER JOIN users u ON m.sender_id = u.id
    LEFT JOIN messages reply_msg ON m.reply_to_message_id = reply_msg.id
    LEFT JOIN users reply_user ON reply_msg.sender_id = reply_user.id
    WHERE m.chat_id = ?
    ORDER BY m.timestamp DESC
    LIMIT ? OFFSET ?
  `);
  
  const messages = stmt.all(chatId, limit, offset);
  
  // Format messages with sender info and reply info
  return messages.map(msg => {
    const messageObj = {
      id: msg.id,
      chatId: msg.chat_id,
      sender: {
        id: msg.sender_id,
        username: msg.sender_username,
        profile_picture_url: msg.sender_profile_picture_url
      },
      content: msg.content,
      timestamp: msg.timestamp
    };
    
    // Add media information if present
    if (msg.media_url && msg.media_type) {
      messageObj.media = {
        url: msg.media_url,
        type: msg.media_type
      };
    }
    
    // Add reply information if this is a reply
    if (msg.reply_to_message_id && msg.reply_message_id && msg.reply_message_content && msg.reply_message_sender_username) {
      messageObj.reply_to = {
        id: msg.reply_message_id,
        content: msg.reply_message_content,
        sender: {
          id: msg.reply_message_sender_id,
          username: msg.reply_message_sender_username,
          profile_picture_url: msg.reply_message_sender_profile_picture_url || null
        }
      };
    }
    
    return messageObj;
  }).reverse(); // Reverse to show oldest first
}

/**
 * Get the last message in a chat
 * @param {number} chatId - Chat ID
 * @returns {Object|null} Last message object or null if no messages
 */
function getLastMessage(chatId) {
  const stmt = db.prepare(`
    SELECT m.*, u.username as sender_username
    FROM messages m
    INNER JOIN users u ON m.sender_id = u.id
    WHERE m.chat_id = ?
    ORDER BY m.timestamp DESC
    LIMIT 1
  `);
  
  const msg = stmt.get(chatId);
  
  if (!msg) {
    return null;
  }
  
  return {
    id: msg.id,
    content: msg.content,
    timestamp: msg.timestamp,
    sender_username: msg.sender_username
  };
}

/**
 * Get unread message count for a user in a chat
 * @param {number} chatId - Chat ID
 * @param {number} userId - User ID
 * @returns {number} Number of unread messages
 */
function getUnreadCount(chatId, userId) {
  // Get the last read message ID for this user in this chat
  const readStatusStmt = db.prepare(`
    SELECT last_read_message_id
    FROM chat_read_status
    WHERE chat_id = ? AND user_id = ?
  `);
  
  const readStatus = readStatusStmt.get(chatId, userId);
  
  if (!readStatus || !readStatus.last_read_message_id) {
    // If no read status, count all messages not sent by the user
    const countStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM messages
      WHERE chat_id = ? AND sender_id != ?
    `);
    const result = countStmt.get(chatId, userId);
    return result ? result.count : 0;
  }
  
  // Count messages after the last read message that weren't sent by the user
  const countStmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM messages
    WHERE chat_id = ? 
      AND id > ? 
      AND sender_id != ?
  `);
  
  const result = countStmt.get(chatId, readStatus.last_read_message_id, userId);
  return result ? result.count : 0;
}

/**
 * Mark messages as read for a user in a chat
 * @param {number} chatId - Chat ID
 * @param {number} userId - User ID
 * @returns {Object} Updated read status
 */
function markAsRead(chatId, userId) {
  // Get the latest message ID in this chat (highest ID, which is the most recent)
  const latestMsgStmt = db.prepare(`
    SELECT MAX(id) as id FROM messages
    WHERE chat_id = ?
  `);
  
  const latestMessage = latestMsgStmt.get(chatId);
  
  if (!latestMessage || !latestMessage.id) {
    // No messages in chat, nothing to mark as read
    return { chatId, userId, last_read_message_id: null };
  }
  
  // Insert or update read status
  // First try to update existing record
  const updateStmt = db.prepare(`
    UPDATE chat_read_status
    SET last_read_message_id = ?, last_read_at = CURRENT_TIMESTAMP
    WHERE chat_id = ? AND user_id = ?
  `);
  
  const updateResult = updateStmt.run(latestMessage.id, chatId, userId);
  
  // If no row was updated, insert new record
  if (updateResult.changes === 0) {
    const insertStmt = db.prepare(`
      INSERT INTO chat_read_status (chat_id, user_id, last_read_message_id, last_read_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
    insertStmt.run(chatId, userId, latestMessage.id);
  }
  
  return {
    chatId,
    userId,
    last_read_message_id: latestMessage.id,
    last_read_at: new Date().toISOString()
  };
}

module.exports = {
  createMessage,
  findMessageById,
  getMessagesByChatId,
  getLastMessage,
  getUnreadCount,
  markAsRead
};

