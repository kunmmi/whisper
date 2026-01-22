/**
 * Message controller
 * Handles message-related operations
 */

const Message = require('../models/Message');
const Chat = require('../models/Chat');

/**
 * Send a message to a chat
 * POST /api/messages/:chatId
 */
function sendMessage(req, res) {
  try {
    const { chatId } = req.params;
    const { content, reply_to_message_id, media_url, media_type } = req.body;
    const senderId = req.user.id;

    // Validate input - either content or media must be provided
    if ((!content || content.trim() === '') && !media_url) {
      return res.status(400).json({ error: 'Message content or media is required' });
    }

    // Validate media_type if media_url is provided
    if (media_url && !media_type) {
      return res.status(400).json({ error: 'media_type is required when media_url is provided' });
    }

    if (media_type && !['image', 'video', 'file'].includes(media_type)) {
      return res.status(400).json({ error: 'media_type must be one of: image, video, file' });
    }

    // Check if chat exists
    const chat = Chat.findChatById(chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if user is a member of the chat
    if (!Chat.isUserMember(chatId, senderId)) {
      return res.status(403).json({ error: 'You are not a member of this chat' });
    }

    // Validate reply_to_message_id if provided
    let replyToMessageId = null;
    if (reply_to_message_id) {
      const replyMessage = Message.findMessageById(reply_to_message_id);
      if (!replyMessage) {
        return res.status(404).json({ error: 'Reply message not found' });
      }
      // Ensure the reply message is in the same chat
      if (replyMessage.chatId !== parseInt(chatId)) {
        return res.status(400).json({ error: 'Reply message must be in the same chat' });
      }
      replyToMessageId = reply_to_message_id;
    }

    // Create message
    const message = Message.createMessage(
      chatId, 
      senderId, 
      content ? content.trim() : '', 
      replyToMessageId,
      media_url || null,
      media_type || null
    );

    // Get sender info
    const User = require('../models/User');
    const sender = User.findById(senderId);

    // Get reply info if this is a reply
    let replyTo = null;
    if (replyToMessageId) {
      const replyMessage = Message.findMessageById(replyToMessageId);
      if (replyMessage) {
        replyTo = {
          id: replyMessage.id,
          content: replyMessage.content,
          sender: replyMessage.sender
        };
      }
    }

    // Return formatted message
    const messageData = {
      id: message.id,
      chatId: parseInt(chatId),
      sender: {
        id: sender.id,
        username: sender.username,
        profile_picture_url: sender.profile_picture_url
      },
      content: message.content,
      timestamp: message.timestamp
    };

    // Add media if present
    if (media_url && media_type) {
      messageData.media = {
        url: media_url,
        type: media_type
      };
    }

    if (replyTo) {
      messageData.reply_to = replyTo;
    }

    res.status(201).json({
      message: messageData
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
}

/**
 * Get messages for a chat with pagination
 * GET /api/messages/:chatId
 */
function getMessages(req, res) {
  try {
    const { chatId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const userId = req.user.id;

    // Check if chat exists
    const chat = Chat.findChatById(chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if user is a member of the chat
    if (!Chat.isUserMember(chatId, userId)) {
      return res.status(403).json({ error: 'You are not a member of this chat' });
    }

    // Get messages
    const messages = Message.getMessagesByChatId(chatId, limit, offset);

    // Mark messages as read when user views them
    Message.markAsRead(chatId, userId);

    res.json({
      messages,
      count: messages.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
}

/**
 * Mark messages as read for a chat
 * POST /api/messages/:chatId/read
 */
function markAsRead(req, res) {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // Check if chat exists
    const chat = Chat.findChatById(chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if user is a member of the chat
    if (!Chat.isUserMember(chatId, userId)) {
      return res.status(403).json({ error: 'You are not a member of this chat' });
    }

    // Mark messages as read
    const readStatus = Message.markAsRead(chatId, userId);

    res.json({
      message: 'Messages marked as read',
      readStatus
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
}

module.exports = {
  sendMessage,
  getMessages,
  markAsRead
};

