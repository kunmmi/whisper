/**
 * Test script for unread messages functionality
 */

require('dotenv').config();
const db = require('./src/config/database');
const { initDatabase } = require('./src/models/initDb');
const Message = require('./src/models/Message');
const Chat = require('./src/models/Chat');
const User = require('./src/models/User');

// Initialize database
initDatabase();

console.log('Testing unread messages functionality...\n');

// Check if chat_read_status table exists
try {
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chat_read_status'").get();
  if (tableCheck) {
    console.log('✓ chat_read_status table exists');
  } else {
    console.log('✗ chat_read_status table does NOT exist');
    process.exit(1);
  }
} catch (error) {
  console.error('Error checking table:', error);
  process.exit(1);
}

// Test unread count function
try {
  // Create test users with unique names
  const timestamp = Date.now();
  const user1 = User.createUser(`testuser1_${timestamp}`, `test1_${timestamp}@test.com`, 'password123');
  const user2 = User.createUser(`testuser2_${timestamp}`, `test2_${timestamp}@test.com`, 'password123');
  
  console.log(`✓ Created test users: ${user1.username} (ID: ${user1.id}), ${user2.username} (ID: ${user2.id})`);
  
  // Create a chat
  const chat = Chat.createChat(false, null);
  Chat.addMember(chat.id, user1.id, 'member');
  Chat.addMember(chat.id, user2.id, 'member');
  
  console.log(`✓ Created test chat (ID: ${chat.id})`);
  
  // Send messages from user2 to user1
  const msg1 = Message.createMessage(chat.id, user2.id, 'Hello');
  const msg2 = Message.createMessage(chat.id, user2.id, 'How are you?');
  
  console.log(`✓ Created 2 messages from ${user2.username} to ${user1.username}`);
  
  // Check unread count for user1 (should be 2)
  const unreadCount1 = Message.getUnreadCount(chat.id, user1.id);
  console.log(`✓ Unread count for ${user1.username}: ${unreadCount1} (expected: 2)`);
  
  if (unreadCount1 !== 2) {
    console.log(`✗ ERROR: Expected 2 unread messages, got ${unreadCount1}`);
    process.exit(1);
  }
  
  // Mark messages as read
  Message.markAsRead(chat.id, user1.id);
  console.log(`✓ Marked messages as read for ${user1.username}`);
  
  // Check unread count again (should be 0)
  const unreadCount2 = Message.getUnreadCount(chat.id, user1.id);
  console.log(`✓ Unread count after marking as read: ${unreadCount2} (expected: 0)`);
  
  if (unreadCount2 !== 0) {
    console.log(`✗ ERROR: Expected 0 unread messages, got ${unreadCount2}`);
    process.exit(1);
  }
  
  // Send another message
  const msg3 = Message.createMessage(chat.id, user2.id, 'New message');
  console.log(`✓ Created new message`);
  
  // Check unread count (should be 1)
  const unreadCount3 = Message.getUnreadCount(chat.id, user1.id);
  console.log(`✓ Unread count after new message: ${unreadCount3} (expected: 1)`);
  
  if (unreadCount3 !== 1) {
    console.log(`✗ ERROR: Expected 1 unread message, got ${unreadCount3}`);
    process.exit(1);
  }
  
  console.log('\n✅ All tests passed! Unread messages functionality is working correctly.');
  
} catch (error) {
  console.error('✗ Test failed:', error);
  console.error(error.stack);
  process.exit(1);
}

