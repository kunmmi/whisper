/**
 * Socket.IO configuration and event handlers
 * Handles real-time messaging, typing indicators, and connection management
 */

const { verifyToken } = require('./jwt');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

// Store user-socket mappings for offline message queuing
const userSockets = new Map(); // userId -> socketId
const socketUsers = new Map(); // socketId -> userId
const onlineUsers = new Set(); // userId -> online status

/**
 * Initialize Socket.IO with event handlers
 * @param {Server} io - Socket.IO server instance
 */
function initializeSocket(io) {
  // Socket authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = verifyToken(token);

      if (!decoded) {
        return next(new Error('Authentication error: Invalid token'));
      }

      // Attach user info to socket
      socket.userId = decoded.id;
      socket.username = decoded.username;
      next();
    } catch (error) {
      next(new Error('Authentication error: ' + error.message));
    }
  });

  // Handle socket connections
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.username} (ID: ${socket.userId}, Socket: ${socket.id})`);

    // Store user-socket mapping
    userSockets.set(socket.userId, socket.id);
    socketUsers.set(socket.id, socket.userId);
    
    // Mark user as online and broadcast to all clients
    onlineUsers.add(socket.userId);
    io.emit('user_online', { userId: socket.userId, username: socket.username });

    // Handle join_chat event
    socket.on('join_chat', async (data) => {
      try {
        const { chatId } = data;

        if (!chatId) {
          socket.emit('error', { error: 'Chat ID is required' });
          return;
        }

        // Verify chat exists
        const chat = Chat.findChatById(chatId);

        if (!chat) {
          socket.emit('error', { error: 'Chat not found' });
          return;
        }

        // Verify user is a member of the chat
        if (!Chat.isUserMember(chatId, socket.userId)) {
          socket.emit('error', { error: 'You are not a member of this chat' });
          return;
        }

        // Join the chat room
        const roomName = `chat:${chatId}`;
        socket.join(roomName);

        console.log(`User ${socket.username} joined chat ${chatId}`);

        // Send confirmation
        socket.emit('joined_chat', { chatId, message: 'Successfully joined chat' });

        // Send any queued messages for this user in this chat
        // TODO: Implement message queuing in future enhancement
      } catch (error) {
        console.error('Join chat error:', error);
        socket.emit('error', { error: 'Failed to join chat' });
      }
    });

    // Handle send_message event
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content, reply_to_message_id, media_url, media_type } = data;

        // Validate input - either content or media must be provided
        if ((!content || content.trim() === '') && !media_url) {
          socket.emit('error', { error: 'Chat ID and content or media are required' });
          return;
        }

        // Validate media_type if media_url is provided
        if (media_url && !media_type) {
          socket.emit('error', { error: 'media_type is required when media_url is provided' });
          return;
        }

        if (media_type && !['image', 'video', 'file'].includes(media_type)) {
          socket.emit('error', { error: 'media_type must be one of: image, video, file' });
          return;
        }

        // Verify chat exists
        const chat = Chat.findChatById(chatId);

        if (!chat) {
          socket.emit('error', { error: 'Chat not found' });
          return;
        }

        // Verify user is a member of the chat
        if (!Chat.isUserMember(chatId, socket.userId)) {
          socket.emit('error', { error: 'You are not a member of this chat' });
          return;
        }

        // Validate reply_to_message_id if provided
        let replyToMessageId = null;
        if (reply_to_message_id) {
          const replyMessage = Message.findMessageById(reply_to_message_id);
          if (!replyMessage) {
            socket.emit('error', { error: 'Reply message not found' });
            return;
          }
          // Ensure the reply message is in the same chat
          if (replyMessage.chatId !== parseInt(chatId)) {
            socket.emit('error', { error: 'Reply message must be in the same chat' });
            return;
          }
          replyToMessageId = reply_to_message_id;
        }

        // Save message to database
        const message = Message.createMessage(
          chatId, 
          socket.userId, 
          content ? content.trim() : '', 
          replyToMessageId,
          media_url || null,
          media_type || null
        );

        // Get sender info
        const sender = User.findById(socket.userId);

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

        // Format message for broadcast
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

        // Broadcast to all users in the chat room (including sender)
        const roomName = `chat:${chatId}`;
        console.log(`Broadcasting message to room ${roomName}:`, { 
          id: messageData.id, 
          hasMedia: !!messageData.media,
          mediaType: messageData.media?.type 
        });
        io.to(roomName).emit('receive_message', messageData);

        console.log(`Message sent in chat ${chatId} by ${socket.username}${replyTo ? ' (reply)' : ''}${messageData.media ? ` (${messageData.media.type})` : ''}`);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { error: 'Failed to send message' });
      }
    });

    // Handle typing_start event
    socket.on('typing_start', (data) => {
      try {
        const { chatId } = data;

        if (!chatId) {
          return;
        }

        // Verify user is a member of the chat
        if (!Chat.isUserMember(chatId, socket.userId)) {
          return;
        }

        const roomName = `chat:${chatId}`;
        socket.to(roomName).emit('user_typing', {
          chatId: parseInt(chatId),
          user: {
            id: socket.userId,
            username: socket.username
          }
        });
      } catch (error) {
        console.error('Typing start error:', error);
      }
    });

    // Handle typing_stop event
    socket.on('typing_stop', (data) => {
      try {
        const { chatId } = data;

        if (!chatId) {
          return;
        }

        // Verify user is a member of the chat
        if (!Chat.isUserMember(chatId, socket.userId)) {
          return;
        }

        const roomName = `chat:${chatId}`;
        socket.to(roomName).emit('user_stopped_typing', {
          chatId: parseInt(chatId),
          user: {
            id: socket.userId,
            username: socket.username
          }
        });
      } catch (error) {
        console.error('Typing stop error:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.username} (Socket: ${socket.id})`);

      // Remove user-socket mapping
      const userId = socketUsers.get(socket.id);
      if (userId) {
        userSockets.delete(userId);
        socketUsers.delete(socket.id);
        
        // Check if user has any other active connections
        const hasOtherConnections = Array.from(userSockets.values()).some(
          (socketId) => socketUsers.get(socketId) === userId && socketId !== socket.id
        );
        
        // If no other connections, mark as offline and broadcast
        if (!hasOtherConnections) {
          onlineUsers.delete(userId);
          io.emit('user_offline', { userId, username: socket.username });
        }
      }
    });
  });

  return io;
}

/**
 * Get online status for a user
 * @param {number} userId - User ID
 * @returns {boolean} True if user is online
 */
function isUserOnline(userId) {
  return onlineUsers.has(userId);
}

/**
 * Get all online user IDs
 * @returns {Array} Array of online user IDs
 */
function getOnlineUsers() {
  return Array.from(onlineUsers);
}

module.exports = { initializeSocket, isUserOnline, getOnlineUsers };

