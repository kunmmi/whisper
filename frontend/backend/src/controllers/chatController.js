/**
 * Chat controller
 * Handles chat-related operations
 */

const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

/**
 * Create a private chat between two users
 * POST /api/chats/private
 * If chat already exists, returns existing chat
 */
function createPrivateChat(req, res) {
  try {
    const { username } = req.body;
    const currentUserId = req.user.id;

    // Validate input
    if (!username || username.trim() === '') {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Find the other user
    const otherUser = User.findByUsername(username.trim());

    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Cannot chat with yourself
    if (otherUser.id === currentUserId) {
      return res.status(400).json({ error: 'Cannot create chat with yourself' });
    }

    // Check if private chat already exists
    let chat = Chat.findPrivateChatBetweenUsers(currentUserId, otherUser.id);

    if (chat) {
      // Return existing chat with members info
      const members = Chat.getChatMembers(chat.id);
      const otherParticipant = Chat.getOtherParticipant(chat.id, currentUserId);
      const lastMessage = Message.getLastMessage(chat.id);

      return res.json({
        chat: {
          id: chat.id,
          is_group: chat.is_group === 1,
          name: chat.name,
          created_at: chat.created_at,
          other_participant: otherParticipant,
          last_message: lastMessage,
          members: members.map(m => ({
            id: m.user_id,
            username: m.username,
            role: m.role,
            profile_picture_url: m.profile_picture_url
          }))
        },
        message: 'Chat already exists'
      });
    }

    // Create new private chat
    chat = Chat.createChat(false, null);

    // Add both users as members
    Chat.addMember(chat.id, currentUserId, 'member');
    Chat.addMember(chat.id, otherUser.id, 'member');

    // Get members info
    const members = Chat.getChatMembers(chat.id);
    const otherParticipant = Chat.getOtherParticipant(chat.id, currentUserId);

    res.status(201).json({
      chat: {
        id: chat.id,
        is_group: false,
        name: null,
        created_at: chat.created_at,
        other_participant: otherParticipant,
        last_message: null,
        members: members.map(m => ({
          id: m.user_id,
          username: m.username,
          role: m.role
        }))
      },
      message: 'Private chat created successfully'
    });
  } catch (error) {
    console.error('Create private chat error:', error);
    res.status(500).json({ error: 'Failed to create private chat' });
  }
}

/**
 * Get all chats for the current user
 * GET /api/chats
 * Returns chats with metadata (last message, other participant, etc.)
 */
function getUserChats(req, res) {
  try {
    const currentUserId = req.user.id;

    // Get all chats for user
    const chats = Chat.getUserChats(currentUserId);

    // Enrich each chat with metadata
    const enrichedChats = chats.map(chat => {
      const members = Chat.getChatMembers(chat.id);
      const lastMessage = Message.getLastMessage(chat.id);
      
      // For private chats, get other participant
      let otherParticipant = null;
      if (chat.is_group === 0) {
        otherParticipant = Chat.getOtherParticipant(chat.id, currentUserId);
      }

      // Get unread message count
      const unreadCount = Message.getUnreadCount(chat.id, currentUserId);

      return {
        id: chat.id,
        is_group: chat.is_group === 1,
        name: chat.name,
        created_at: chat.created_at,
        other_participant: otherParticipant,
        last_message: lastMessage,
        unread_count: unreadCount,
        members: members.map(m => ({
          id: m.user_id,
          username: m.username,
          role: m.role,
          profile_picture_url: m.profile_picture_url
        }))
      };
    });

    res.json({
      chats: enrichedChats,
      count: enrichedChats.length
    });
  } catch (error) {
    console.error('Get user chats error:', error);
    res.status(500).json({ error: 'Failed to get user chats' });
  }
}

/**
 * Create a group chat
 * POST /api/chats/group
 * Creator automatically becomes admin
 */
function createGroup(req, res) {
  try {
    const { name, usernames } = req.body;
    const currentUserId = req.user.id;

    // Validate input
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Group name is required' });
    }

    if (name.length < 3 || name.length > 50) {
      return res.status(400).json({ error: 'Group name must be between 3 and 50 characters' });
    }

    if (!Array.isArray(usernames)) {
      return res.status(400).json({ error: 'usernames must be an array' });
    }

    // Check group size limit (50 including creator)
    if (usernames.length > 49) {
      return res.status(400).json({ error: 'Group cannot have more than 50 members' });
    }

    // Create group chat
    const chat = Chat.createChat(true, name.trim());

    // Add creator as admin
    Chat.addMember(chat.id, currentUserId, 'admin');

    // Add other users as members
    const addedUsers = [];
    const notFoundUsers = [];

    for (const username of usernames) {
      const user = User.findByUsername(username.trim());
      if (user) {
        // Check if user is already added (avoid duplicates)
        if (!Chat.isUserMember(chat.id, user.id)) {
          Chat.addMember(chat.id, user.id, 'member');
          addedUsers.push(user.username);
        }
      } else {
        notFoundUsers.push(username);
      }
    }

    // Get members info
    const members = Chat.getChatMembers(chat.id);

    res.status(201).json({
      chat: {
        id: chat.id,
        is_group: true,
        name: chat.name,
        created_at: chat.created_at,
        members: members.map(m => ({
          id: m.user_id,
          username: m.username,
          role: m.role
        })),
        member_count: members.length
      },
      message: 'Group created successfully',
      added_users: addedUsers,
      not_found_users: notFoundUsers.length > 0 ? notFoundUsers : undefined
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
}

/**
 * Add user to group
 * POST /api/chats/:chatId/add-user
 * Admin only
 */
function addUserToGroup(req, res) {
  try {
    const { chatId } = req.params;
    const { username } = req.body;
    const currentUserId = req.user.id;

    // Validate input
    if (!username || username.trim() === '') {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Check if chat exists
    const chat = Chat.findChatById(chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if chat is a group
    if (chat.is_group === 0) {
      return res.status(400).json({ error: 'This is not a group chat' });
    }

    // Check if user is admin
    if (!Chat.isUserAdmin(chatId, currentUserId)) {
      return res.status(403).json({ error: 'Only admins can add users to the group' });
    }

    // Check group size limit
    const memberCount = Chat.getMemberCount(chatId);
    if (memberCount >= 50) {
      return res.status(400).json({ error: 'Group has reached maximum size (50 members)' });
    }

    // Find user to add
    const userToAdd = User.findByUsername(username.trim());

    if (!userToAdd) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a member
    if (Chat.isUserMember(chatId, userToAdd.id)) {
      return res.status(400).json({ error: 'User is already a member of this group' });
    }

    // Add user to group
    Chat.addMember(chatId, userToAdd.id, 'member');

    // Get updated members
    const members = Chat.getChatMembers(chatId);

    res.json({
      message: 'User added to group successfully',
      user: {
        id: userToAdd.id,
        username: userToAdd.username
      },
      member_count: members.length
    });
  } catch (error) {
    console.error('Add user to group error:', error);
    res.status(500).json({ error: 'Failed to add user to group' });
  }
}

/**
 * Remove user from group
 * POST /api/chats/:chatId/remove-user
 * Admin only (cannot remove last admin)
 */
function removeUserFromGroup(req, res) {
  try {
    const { chatId } = req.params;
    const { username } = req.body;
    const currentUserId = req.user.id;

    // Validate input
    if (!username || username.trim() === '') {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Check if chat exists
    const chat = Chat.findChatById(chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if chat is a group
    if (chat.is_group === 0) {
      return res.status(400).json({ error: 'This is not a group chat' });
    }

    // Check if user is admin
    if (!Chat.isUserAdmin(chatId, currentUserId)) {
      return res.status(403).json({ error: 'Only admins can remove users from the group' });
    }

    // Find user to remove
    const userToRemove = User.findByUsername(username.trim());

    if (!userToRemove) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is a member
    if (!Chat.isUserMember(chatId, userToRemove.id)) {
      return res.status(400).json({ error: 'User is not a member of this group' });
    }

    // Check if user to remove is admin
    if (Chat.isUserAdmin(chatId, userToRemove.id)) {
      // Check if this is the last admin
      const adminCount = Chat.getAdminCount(chatId);
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot remove the last admin from the group' });
      }
    }

    // Remove user from group
    Chat.removeMember(chatId, userToRemove.id);

    res.json({
      message: 'User removed from group successfully',
      user: {
        id: userToRemove.id,
        username: userToRemove.username
      }
    });
  } catch (error) {
    console.error('Remove user from group error:', error);
    res.status(500).json({ error: 'Failed to remove user from group' });
  }
}

/**
 * Leave group
 * POST /api/chats/:chatId/leave
 * Any member can leave (but not if last admin)
 */
function leaveGroup(req, res) {
  try {
    const { chatId } = req.params;
    const currentUserId = req.user.id;

    // Check if chat exists
    const chat = Chat.findChatById(chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if chat is a group
    if (chat.is_group === 0) {
      return res.status(400).json({ error: 'This is not a group chat. Use delete chat instead.' });
    }

    // Check if user is a member
    if (!Chat.isUserMember(chatId, currentUserId)) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // Check if user is admin
    if (Chat.isUserAdmin(chatId, currentUserId)) {
      // Check if this is the last admin
      const adminCount = Chat.getAdminCount(chatId);
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot leave group as the last admin. Remove all members or transfer admin first.' });
      }
    }

    // Remove user from group
    Chat.removeMember(chatId, currentUserId);

    res.json({
      message: 'Left group successfully'
    });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ error: 'Failed to leave group' });
  }
}

/**
 * Rename group
 * PUT /api/chats/:chatId/rename
 * Admin only
 */
function renameGroup(req, res) {
  try {
    const { chatId } = req.params;
    const { name } = req.body;
    const currentUserId = req.user.id;

    // Validate input
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Group name is required' });
    }

    if (name.length < 3 || name.length > 50) {
      return res.status(400).json({ error: 'Group name must be between 3 and 50 characters' });
    }

    // Check if chat exists
    const chat = Chat.findChatById(chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if chat is a group
    if (chat.is_group === 0) {
      return res.status(400).json({ error: 'This is not a group chat' });
    }

    // Check if user is admin
    if (!Chat.isUserAdmin(chatId, currentUserId)) {
      return res.status(403).json({ error: 'Only admins can rename the group' });
    }

    // Update group name
    Chat.updateGroupName(chatId, name.trim());

    // Get updated chat
    const updatedChat = Chat.findChatById(chatId);

    res.json({
      message: 'Group renamed successfully',
      chat: {
        id: updatedChat.id,
        name: updatedChat.name
      }
    });
  } catch (error) {
    console.error('Rename group error:', error);
    res.status(500).json({ error: 'Failed to rename group' });
  }
}

/**
 * Delete a chat (remove user from chat)
 * DELETE /api/chats/:chatId
 * For private chats: removes user from chat (effectively deletes it for them)
 * For group chats: removes user from group (same as leave, but called delete)
 */
function deleteChat(req, res) {
  try {
    const { chatId } = req.params;
    const currentUserId = req.user.id;

    // Check if chat exists
    const chat = Chat.findChatById(chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if user is a member
    if (!Chat.isUserMember(chatId, currentUserId)) {
      return res.status(403).json({ error: 'You are not a member of this chat' });
    }

    // For group chats, check if user is admin
    if (chat.is_group === 1 && Chat.isUserAdmin(chatId, currentUserId)) {
      // Check if this is the last admin
      const adminCount = Chat.getAdminCount(chatId);
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete group as the last admin. Remove all members first.' });
      }
    }

    // Remove user from chat
    Chat.removeMember(chatId, currentUserId);

    res.json({
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
}

module.exports = {
  createPrivateChat,
  getUserChats,
  createGroup,
  addUserToGroup,
  removeUserFromGroup,
  leaveGroup,
  renameGroup,
  deleteChat
};

