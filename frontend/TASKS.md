# Development Task Breakdown — Chat App MVP

This document breaks down the development into manageable tasks and subtasks. Each task should be completed and tested before moving to the next.

---

## Phase 0 — Project Scaffolding

### Task 0.1: Backend Project Setup
- [ ] Create `/backend` folder
- [ ] Initialize npm project (`npm init -y`)
- [ ] Install dependencies:
  - [ ] express
  - [ ] socket.io
  - [ ] jsonwebtoken
  - [ ] bcrypt
  - [ ] sqlite3 (or better-sqlite3)
  - [ ] dotenv
  - [ ] cors
- [ ] Create folder structure:
  - [ ] `/src/config`
  - [ ] `/src/routes`
  - [ ] `/src/controllers`
  - [ ] `/src/middleware`
  - [ ] `/src/models`
- [ ] Create `server.js` in `/src`
- [ ] Create `.env.example` file
- [ ] Create `.gitignore` (exclude node_modules, .env, database.sqlite)

### Task 0.2: Backend Basic Server
- [ ] Set up Express server in `server.js`
- [ ] Configure dotenv
- [ ] Add CORS middleware (allow localhost:3001)
- [ ] Create `/health` test route
- [ ] Add error handling middleware
- [ ] Test server runs on port 3000

### Task 0.3: Database Configuration
- [ ] Create database config file (`/src/config/database.js`)
- [ ] Initialize SQLite connection
- [ ] Create empty database file (database.sqlite)
- [ ] Test database connection

### Task 0.4: Frontend Project Setup
- [ ] Create `/frontend` folder
- [ ] Initialize React app (create-react-app or Vite)
- [ ] Install dependencies:
  - [ ] socket.io-client
  - [ ] axios (or fetch)
- [ ] Install and configure Tailwind CSS
- [ ] Update App.js to show "Chat App MVP"
- [ ] Test React app runs on port 3001

### Task 0.5: Phase 0 Verification
- [ ] Backend `/health` route responds correctly
- [ ] Frontend displays "Chat App MVP"
- [ ] Both servers run simultaneously without conflicts
- [ ] Document how to run both servers

**Deliverable:** Working backend and frontend scaffolding

---

## Phase 1 — Authentication System

### Task 1.1: Database Schema - Users Table
- [ ] Create database migration/setup file (`/src/models/initDb.js` or similar)
- [ ] Create `users` table with columns:
  - [ ] `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
  - [ ] `username` (TEXT UNIQUE NOT NULL)
  - [ ] `email` (TEXT UNIQUE NOT NULL)
  - [ ] `password_hash` (TEXT NOT NULL)
  - [ ] `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- [ ] Add index on `username`
- [ ] Add index on `email`
- [ ] Test table creation

### Task 1.2: User Model
- [ ] Create `/src/models/User.js`
- [ ] Implement functions:
  - [ ] `createUser(username, email, passwordHash)`
  - [ ] `findByEmail(email)`
  - [ ] `findByUsername(username)`
  - [ ] `findById(id)`
  - [ ] `findByEmailOrUsername(identifier)`
- [ ] Add error handling
- [ ] Test model functions

### Task 1.3: Validation Middleware
- [ ] Create `/src/middleware/validation.js`
- [ ] Implement email validation (format check)
- [ ] Implement password validation:
  - [ ] Min 8 characters
  - [ ] At least 1 letter
  - [ ] At least 1 number
- [ ] Implement username validation:
  - [ ] 3-20 characters
  - [ ] Letters, numbers, underscore only
- [ ] Create validation middleware functions
- [ ] Test validation functions

### Task 1.4: Auth Controller - Register
- [ ] Create `/src/controllers/authController.js`
- [ ] Implement `register` function:
  - [ ] Validate input (email, username, password)
  - [ ] Check if email exists
  - [ ] Check if username exists
  - [ ] Hash password with bcrypt
  - [ ] Create user in database
  - [ ] Return success response (exclude password_hash)
- [ ] Handle errors (duplicate email/username)
- [ ] Test register endpoint

### Task 1.5: Auth Controller - Login
- [ ] Implement `login` function:
  - [ ] Accept email OR username
  - [ ] Find user by email or username
  - [ ] Verify password with bcrypt
  - [ ] Generate JWT token
  - [ ] Return token and user info
- [ ] Handle errors (invalid credentials)
- [ ] Test login endpoint

### Task 1.6: JWT Middleware
- [ ] Create `/src/middleware/auth.js`
- [ ] Create JWT config (`/src/config/jwt.js`):
  - [ ] JWT_SECRET from env
  - [ ] Token expiration (e.g., 7 days)
- [ ] Implement `authenticateToken` middleware:
  - [ ] Extract token from Authorization header
  - [ ] Verify token
  - [ ] Attach user to `req.user`
- [ ] Handle errors (invalid/missing token)
- [ ] Test middleware

### Task 1.7: Auth Routes
- [ ] Create `/src/routes/authRoutes.js`
- [ ] Set up routes:
  - [ ] POST `/api/auth/register` → register controller
  - [ ] POST `/api/auth/login` → login controller
  - [ ] GET `/api/auth/me` → protected route with auth middleware
- [ ] Create `/api/auth/me` controller:
  - [ ] Return current user info (from req.user)
- [ ] Mount routes in `server.js`
- [ ] Test all routes

### Task 1.8: Phase 1 Verification
- [ ] Test register with valid data
- [ ] Test register with duplicate email (should error)
- [ ] Test register with duplicate username (should error)
- [ ] Test register with invalid password (should error)
- [ ] Test login with email
- [ ] Test login with username
- [ ] Test login with wrong password (should error)
- [ ] Test `/api/auth/me` with valid token
- [ ] Test `/api/auth/me` without token (should error)
- [ ] Document test instructions

**Deliverable:** Working authentication system with JWT protection

---

## Phase 2 — User Search

### Task 2.1: Database Index
- [ ] Verify username column has index (already done in Phase 1)
- [ ] If not, add index on username for performance

### Task 2.2: User Search Model
- [ ] Add `searchUsers` function to User model:
  - [ ] Partial match search on username (LIKE query)
  - [ ] Exclude current user from results
  - [ ] Limit results (e.g., max 20)
  - [ ] Return id and username only
- [ ] Test search function

### Task 2.3: User Search Controller
- [ ] Create `/src/controllers/userController.js`
- [ ] Implement `searchUsers` function:
  - [ ] Get username query parameter
  - [ ] Validate query parameter exists
  - [ ] Call User model search function
  - [ ] Return results array
- [ ] Handle errors
- [ ] Test controller

### Task 2.4: User Search Routes
- [ ] Create `/src/routes/userRoutes.js`
- [ ] Set up route:
  - [ ] GET `/api/users/search?username=` → search controller
- [ ] Add authentication middleware (protected route)
- [ ] Mount routes in `server.js`
- [ ] Test route

### Task 2.5: Phase 2 Verification
- [ ] Test search with partial username match
- [ ] Test search excludes current user
- [ ] Test search with no results
- [ ] Test search without authentication (should error)
- [ ] Test search with empty query (should handle gracefully)
- [ ] Document test instructions

**Deliverable:** Working user search functionality

---

## Phase 3 — Private Chats (No Real-Time)

### Task 3.1: Database Schema - Chats Tables
- [ ] Create `chats` table:
  - [ ] `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
  - [ ] `is_group` (BOOLEAN DEFAULT 0)
  - [ ] `name` (TEXT - nullable for private chats)
  - [ ] `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- [ ] Create `chat_members` table:
  - [ ] `chat_id` (INTEGER - foreign key to chats.id)
  - [ ] `user_id` (INTEGER - foreign key to users.id)
  - [ ] `role` (TEXT DEFAULT 'member' - 'admin' or 'member')
  - [ ] PRIMARY KEY (chat_id, user_id)
- [ ] Create `messages` table:
  - [ ] `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
  - [ ] `chat_id` (INTEGER - foreign key to chats.id)
  - [ ] `sender_id` (INTEGER - foreign key to users.id)
  - [ ] `content` (TEXT NOT NULL)
  - [ ] `timestamp` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- [ ] Add indexes:
  - [ ] Index on `chat_members.chat_id`
  - [ ] Index on `chat_members.user_id`
  - [ ] Index on `messages.chat_id`
  - [ ] Index on `messages.timestamp`
- [ ] Test table creation

### Task 3.2: Chat Model
- [ ] Create `/src/models/Chat.js`
- [ ] Implement functions:
  - [ ] `createChat(isGroup, name)`
  - [ ] `addMember(chatId, userId, role)`
  - [ ] `findChatById(chatId)`
  - [ ] `findPrivateChatBetweenUsers(userId1, userId2)`
  - [ ] `getUserChats(userId)` - with metadata (last message, etc.)
  - [ ] `isUserMember(chatId, userId)`
- [ ] Test model functions

### Task 3.3: Message Model
- [ ] Create `/src/models/Message.js`
- [ ] Implement functions:
  - [ ] `createMessage(chatId, senderId, content)`
  - [ ] `getMessagesByChatId(chatId, limit, offset)`
  - [ ] `getLastMessage(chatId)`
- [ ] Test model functions

### Task 3.4: Chat Controller - Create Private Chat
- [ ] Create `/src/controllers/chatController.js`
- [ ] Implement `createPrivateChat` function:
  - [ ] Get username from request body
  - [ ] Find user by username
  - [ ] Check if user exists
  - [ ] Check if chat already exists between users
  - [ ] If exists, return existing chat
  - [ ] If not, create new chat and add both users as members
  - [ ] Return chat with members info
- [ ] Handle errors (user not found, cannot chat with self)
- [ ] Test controller

### Task 3.5: Chat Controller - Get User Chats
- [ ] Implement `getUserChats` function:
  - [ ] Get current user from req.user
  - [ ] Fetch all chats for user
  - [ ] For each chat, get:
    - [ ] Last message content
    - [ ] Last message timestamp
    - [ ] Other participant info (for private chats)
    - [ ] Unread count (can be 0 for now)
  - [ ] Return formatted chat list
- [ ] Test controller

### Task 3.6: Message Controller - Send Message
- [ ] Create `/src/controllers/messageController.js`
- [ ] Implement `sendMessage` function:
  - [ ] Get chatId from params
  - [ ] Get content from request body
  - [ ] Validate user is member of chat
  - [ ] Create message in database
  - [ ] Return created message
- [ ] Handle errors (chat not found, not a member, invalid content)
- [ ] Test controller

### Task 3.7: Message Controller - Get Messages
- [ ] Implement `getMessages` function:
  - [ ] Get chatId from params
  - [ ] Get limit and offset from query params (defaults: limit=50, offset=0)
  - [ ] Validate user is member of chat
  - [ ] Fetch messages with pagination
  - [ ] Include sender info (id, username) in response
  - [ ] Return paginated messages
- [ ] Handle errors (chat not found, not a member)
- [ ] Test controller

### Task 3.8: Chat Routes
- [ ] Create `/src/routes/chatRoutes.js`
- [ ] Set up routes:
  - [ ] POST `/api/chats/private` → createPrivateChat controller
  - [ ] GET `/api/chats` → getUserChats controller
- [ ] Add authentication middleware to all routes
- [ ] Mount routes in `server.js`
- [ ] Test routes

### Task 3.9: Message Routes
- [ ] Create `/src/routes/messageRoutes.js`
- [ ] Set up routes:
  - [ ] GET `/api/messages/:chatId` → getMessages controller
  - [ ] POST `/api/messages/:chatId` → sendMessage controller
- [ ] Add authentication middleware to all routes
- [ ] Mount routes in `server.js`
- [ ] Test routes

### Task 3.10: Phase 3 Verification
- [ ] Test create private chat with valid username
- [ ] Test create private chat with non-existent user (should error)
- [ ] Test create private chat with self (should error)
- [ ] Test create duplicate private chat (should return existing)
- [ ] Test get user chats (should return list with metadata)
- [ ] Test send message to valid chat
- [ ] Test send message to chat user is not member of (should error)
- [ ] Test get messages with pagination
- [ ] Test get messages with limit and offset
- [ ] Document test instructions

**Deliverable:** Working private chat system with REST API

---

## Phase 4 — Real-Time Messaging

### Task 4.1: Socket.IO Server Setup
- [ ] Integrate Socket.IO with Express server
- [ ] Create `/src/config/socket.js` or socket setup in `server.js`
- [ ] Configure CORS for Socket.IO (allow localhost:3001)
- [ ] Test Socket.IO connection

### Task 4.2: Socket Authentication Middleware
- [ ] Create socket authentication middleware:
  - [ ] Extract JWT token from handshake auth
  - [ ] Verify token
  - [ ] Attach user info to socket
  - [ ] Reject connection if invalid token
- [ ] Test authentication

### Task 4.3: Socket Connection Handler
- [ ] Handle socket connection:
  - [ ] Authenticate socket
  - [ ] Store user-socket mapping (for offline queuing)
  - [ ] Handle disconnect
- [ ] Test connection/disconnection

### Task 4.4: Join Chat Room Handler
- [ ] Implement `join_chat` event handler:
  - [ ] Get chatId from payload
  - [ ] Verify user is member of chat
  - [ ] Join socket to room (room name: `chat:${chatId}`)
  - [ ] Send confirmation
- [ ] Handle errors (chat not found, not a member)
- [ ] Test join_chat event

### Task 4.5: Send Message Handler
- [ ] Implement `send_message` event handler:
  - [ ] Get chatId and content from payload
  - [ ] Verify user is member of chat
  - [ ] Validate content
  - [ ] Save message to database
  - [ ] Get sender info
  - [ ] Broadcast `receive_message` to room (excluding sender)
  - [ ] Send confirmation to sender
- [ ] Handle errors
- [ ] Test send_message event

### Task 4.6: Receive Message Format
- [ ] Format `receive_message` payload:
  - [ ] Include message id
  - [ ] Include chatId
  - [ ] Include sender object (id, username)
  - [ ] Include content
  - [ ] Include timestamp (ISO format)
- [ ] Test message format

### Task 4.7: Offline Message Queuing (Basic)
- [ ] Create in-memory queue for offline users:
  - [ ] Store messages for users not connected
  - [ ] When user connects, check for queued messages
  - [ ] Send queued messages on connection
- [ ] Implement basic queue (can be enhanced later)
- [ ] Test offline queuing

### Task 4.8: Typing Indicators (Basic)
- [ ] Implement `typing_start` event:
  - [ ] Broadcast to chat room (excluding sender)
- [ ] Implement `typing_stop` event:
  - [ ] Broadcast to chat room (excluding sender)
- [ ] Add timeout (e.g., 3 seconds auto-stop)
- [ ] Test typing indicators

### Task 4.9: Read Receipts (Basic)
- [ ] Create `read_receipts` table (optional for MVP):
  - [ ] `message_id` (INTEGER)
  - [ ] `user_id` (INTEGER)
  - [ ] `read_at` (DATETIME)
- [ ] Implement `message_read` event:
  - [ ] Mark messages as read
  - [ ] Store in database
- [ ] Update message queries to include read status
- [ ] Test read receipts

### Task 4.10: Delivery Status (Basic)
- [ ] Add delivery tracking:
  - [ ] Mark message as delivered when received
  - [ ] Update message status in real-time
- [ ] Include delivery status in message payload
- [ ] Test delivery status

### Task 4.11: Phase 4 Verification
- [ ] Test socket connection with valid token
- [ ] Test socket connection with invalid token (should reject)
- [ ] Test join_chat event
- [ ] Test send_message event (should broadcast to room)
- [ ] Test receive_message format
- [ ] Test typing indicators
- [ ] Test read receipts
- [ ] Test offline message queuing
- [ ] Document test instructions

**Deliverable:** Working real-time messaging with Socket.IO

---

## Phase 5 — Group Chats

### Task 5.1: Chat Controller - Create Group
- [ ] Implement `createGroup` function:
  - [ ] Get name and usernames array from request body
  - [ ] Validate group name (3-50 characters)
  - [ ] Validate usernames array
  - [ ] Check group size limit (max 50 including creator)
  - [ ] Create group chat (is_group = true)
  - [ ] Add creator as admin
  - [ ] Add other users as members
  - [ ] Return created group
- [ ] Handle errors (duplicate users, invalid usernames, size limit)
- [ ] Test controller

### Task 5.2: Chat Controller - Add User to Group
- [ ] Implement `addUserToGroup` function:
  - [ ] Get chatId from params
  - [ ] Get username from request body
  - [ ] Verify user is admin
  - [ ] Verify chat is a group
  - [ ] Check group size limit
  - [ ] Find user by username
  - [ ] Check if user already in group
  - [ ] Add user to group as member
  - [ ] Return success
- [ ] Handle errors (not admin, not a group, user not found, already member, size limit)
- [ ] Test controller

### Task 5.3: Chat Controller - Remove User from Group
- [ ] Implement `removeUserFromGroup` function:
  - [ ] Get chatId from params
  - [ ] Get username from request body
  - [ ] Verify user is admin
  - [ ] Verify chat is a group
  - [ ] Find user to remove
  - [ ] Check if user is last admin (prevent removal)
  - [ ] Remove user from group
  - [ ] Return success
- [ ] Handle errors (not admin, not a group, user not found, last admin)
- [ ] Test controller

### Task 5.4: Chat Controller - Leave Group
- [ ] Implement `leaveGroup` function:
  - [ ] Get chatId from params
  - [ ] Get current user from req.user
  - [ ] Verify chat is a group
  - [ ] Check if user is last admin (prevent leaving)
  - [ ] Remove user from group
  - [ ] Return success
- [ ] Handle errors (not a group, last admin)
- [ ] Test controller

### Task 5.5: Chat Controller - Rename Group
- [ ] Implement `renameGroup` function:
  - [ ] Get chatId from params
  - [ ] Get name from request body
  - [ ] Validate user is admin
  - [ ] Validate chat is a group
  - [ ] Validate new name (3-50 characters)
  - [ ] Update group name
  - [ ] Return updated group
- [ ] Handle errors (not admin, not a group, invalid name)
- [ ] Test controller

### Task 5.6: Chat Model - Group Functions
- [ ] Add functions to Chat model:
  - [ ] `getGroupMembers(chatId)` - get all members with roles
  - [ ] `getAdminCount(chatId)` - count admins
  - [ ] `isUserAdmin(chatId, userId)` - check if user is admin
  - [ ] `updateGroupName(chatId, name)` - update name
- [ ] Test model functions

### Task 5.7: Group Routes
- [ ] Add routes to `/src/routes/chatRoutes.js`:
  - [ ] POST `/api/chats/group` → createGroup controller
  - [ ] POST `/api/chats/:chatId/add-user` → addUserToGroup controller
  - [ ] POST `/api/chats/:chatId/remove-user` → removeUserFromGroup controller
  - [ ] POST `/api/chats/:chatId/leave` → leaveGroup controller
  - [ ] PUT `/api/chats/:chatId/rename` → renameGroup controller
- [ ] Add authentication middleware
- [ ] Test routes

### Task 5.8: Socket.IO - Group Events
- [ ] Update socket handlers to support groups:
  - [ ] Handle group member additions (notify all members)
  - [ ] Handle group member removals (notify all members)
  - [ ] Handle group name changes (notify all members)
- [ ] Test group socket events

### Task 5.9: Phase 5 Verification
- [ ] Test create group with valid data
- [ ] Test create group exceeding size limit (should error)
- [ ] Test add user to group (as admin)
- [ ] Test add user as non-admin (should error)
- [ ] Test add duplicate user (should error)
- [ ] Test remove user from group (as admin)
- [ ] Test remove last admin (should error)
- [ ] Test leave group as member
- [ ] Test leave group as last admin (should error)
- [ ] Test rename group (as admin)
- [ ] Test rename group as non-admin (should error)
- [ ] Document test instructions

**Deliverable:** Working group chat system with admin permissions

---

## Phase 6 — Frontend Integration

### Task 6.1: Frontend Setup - Dependencies
- [ ] Install additional dependencies:
  - [ ] react-router-dom (for routing)
  - [ ] axios (for API calls)
  - [ ] socket.io-client (already installed)
- [ ] Set up API base URL configuration
- [ ] Set up Socket.IO client configuration

### Task 6.2: Auth Context/State Management
- [ ] Create auth context (`/src/contexts/AuthContext.js`):
  - [ ] Store JWT token (localStorage)
  - [ ] Store current user
  - [ ] Login function
  - [ ] Register function
  - [ ] Logout function
  - [ ] Check auth status
- [ ] Create auth provider component
- [ ] Test auth context

### Task 6.3: API Service Layer
- [ ] Create `/src/services/api.js`:
  - [ ] Configure axios with base URL
  - [ ] Add request interceptor (attach token)
  - [ ] Add response interceptor (handle errors)
- [ ] Create API functions:
  - [ ] Auth API (register, login, getMe)
  - [ ] User API (searchUsers)
  - [ ] Chat API (createPrivateChat, createGroup, getUserChats, etc.)
  - [ ] Message API (getMessages, sendMessage)
- [ ] Test API functions

### Task 6.4: Socket Service
- [ ] Create `/src/services/socket.js`:
  - [ ] Initialize Socket.IO client
  - [ ] Connect with JWT token
  - [ ] Handle connection/disconnection
  - [ ] Export socket instance
- [ ] Create socket hook (`useSocket.js`):
  - [ ] Manage socket connection
  - [ ] Handle socket events
- [ ] Test socket connection

### Task 6.5: Protected Route Component
- [ ] Create `ProtectedRoute` component:
  - [ ] Check if user is authenticated
  - [ ] Redirect to login if not
  - [ ] Render children if authenticated
- [ ] Test protected routes

### Task 6.6: Login Page
- [ ] Create `/src/pages/Login.js`:
  - [ ] Email/username input
  - [ ] Password input
  - [ ] Login button
  - [ ] Link to register page
  - [ ] Error message display
  - [ ] Loading spinner
- [ ] Handle form submission
- [ ] Handle errors
- [ ] Test login page

### Task 6.7: Register Page
- [ ] Create `/src/pages/Register.js`:
  - [ ] Username input
  - [ ] Email input
  - [ ] Password input
  - [ ] Register button
  - [ ] Link to login page
  - [ ] Error message display
  - [ ] Loading spinner
- [ ] Handle form submission
  - [ ] Validate inputs client-side
  - [ ] Show validation errors
- [ ] Handle errors
- [ ] Test register page

### Task 6.8: Dashboard Page - Chat List
- [ ] Create `/src/pages/Dashboard.js`:
  - [ ] Fetch user chats on mount
  - [ ] Display chat list:
    - [ ] Chat name (or other participant name for private)
    - [ ] Last message preview
    - [ ] Last message timestamp
  - [ ] Loading spinner
  - [ ] Empty state
- [ ] Handle chat selection (navigate to chat)
- [ ] Test dashboard

### Task 6.9: User Search Component
- [ ] Create `/src/components/UserSearch.js`:
  - [ ] Search input
  - [ ] Search button
  - [ ] Results list
  - [ ] Loading spinner
- [ ] Implement search functionality:
  - [ ] Debounce search input
  - [ ] Call search API
  - [ ] Display results
- [ ] Handle "Start Chat" button:
  - [ ] Create private chat
  - [ ] Navigate to chat
- [ ] Test user search

### Task 6.10: Chat Window Component
- [ ] Create `/src/pages/ChatWindow.js`:
  - [ ] Display chat header (name, participants)
  - [ ] Display messages list:
    - [ ] Username
    - [ ] Message content
    - [ ] Timestamp
  - [ ] Message input
  - [ ] Send button
  - [ ] Loading spinner
- [ ] Fetch messages on mount
- [ ] Handle pagination (load more messages)
- [ ] Test chat window

### Task 6.11: Real-Time Messaging Integration
- [ ] Integrate Socket.IO in ChatWindow:
  - [ ] Join chat room on mount
  - [ ] Listen for `receive_message` events
  - [ ] Update messages list in real-time
  - [ ] Handle `send_message` event
  - [ ] Clean up on unmount
- [ ] Update message sending:
  - [ ] Send via Socket.IO instead of REST
  - [ ] Optimistically update UI
- [ ] Test real-time messaging

### Task 6.12: Typing Indicators
- [ ] Add typing indicator to ChatWindow:
  - [ ] Listen for `typing_start` and `typing_stop` events
  - [ ] Display "User is typing..." message
  - [ ] Send typing events on input
  - [ ] Auto-stop after timeout
- [ ] Test typing indicators

### Task 6.13: Group Management Panel
- [ ] Create `/src/components/GroupManagement.js`:
  - [ ] Display group members list
  - [ ] Add user input (admin only)
  - [ ] Remove user button (admin only)
  - [ ] Rename group input (admin only)
  - [ ] Leave group button
- [ ] Handle group actions:
  - [ ] Add user
  - [ ] Remove user
  - [ ] Rename group
  - [ ] Leave group
- [ ] Show loading states
- [ ] Handle errors
- [ ] Test group management

### Task 6.14: Create Group Component
- [ ] Create `/src/components/CreateGroup.js`:
  - [ ] Group name input
  - [ ] User search and selection
  - [ ] Selected users list
  - [ ] Create button
  - [ ] Loading spinner
- [ ] Handle group creation
- [ ] Navigate to new group chat
- [ ] Test create group

### Task 6.15: Routing Setup
- [ ] Set up React Router:
  - [ ] `/login` → Login page
  - [ ] `/register` → Register page
  - [ ] `/dashboard` → Dashboard (protected)
  - [ ] `/chat/:chatId` → ChatWindow (protected)
- [ ] Handle navigation
- [ ] Test routing

### Task 6.16: Error Handling & Loading States
- [ ] Add global error handler
- [ ] Add loading indicators throughout:
  - [ ] Button loading states
  - [ ] Page loading states
  - [ ] Spinner component
- [ ] Display error messages consistently
- [ ] Test error handling

### Task 6.17: UI Polish (MVP Level)
- [ ] Apply Tailwind CSS styling:
  - [ ] Consistent color scheme
  - [ ] Responsive layout
  - [ ] Basic animations/transitions
- [ ] Format timestamps (relative time)
- [ ] Format message display
- [ ] Test UI

### Task 6.18: Phase 6 Verification
- [ ] Test complete user flow:
  - [ ] Register → Login → Search User → Create Chat → Send Messages
  - [ ] Create Group → Add Members → Send Messages
  - [ ] Real-time message updates
  - [ ] Typing indicators
- [ ] Test error scenarios
- [ ] Test loading states
- [ ] Document how to run full application

**Deliverable:** Complete full-stack chat application

---

## Final Tasks

### Task 7.1: End-to-End Testing
- [ ] Test all features together
- [ ] Test edge cases
- [ ] Fix any bugs found
- [ ] Verify all requirements met

### Task 7.2: Documentation
- [ ] Create README.md:
  - [ ] Project description
  - [ ] Installation instructions
  - [ ] How to run
  - [ ] API documentation
  - [ ] Environment variables
- [ ] Document known limitations
- [ ] Document future enhancements

### Task 7.3: Code Cleanup
- [ ] Remove console.logs
- [ ] Remove commented code
- [ ] Ensure all files have comments
- [ ] Verify no TODO comments remain
- [ ] Run final linting check

---

## Notes

- Each task should be completed and tested before moving to the next
- After each phase, stop and get approval before continuing
- If something breaks, fix it before proceeding
- Keep code simple and readable
- Add comments explaining complex logic

