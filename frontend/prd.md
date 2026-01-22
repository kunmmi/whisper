# Cursor Build Spec — Real-Time Chat Web App

## Purpose

This document is an instruction set for Cursor AI to build a full-stack real-time chat application in strict phases. Cursor must follow the order, stop after each phase, and wait for user approval before continuing.

---

# Global Rules (Must Follow)

1. Do NOT skip phases
2. Do NOT generate frontend code until backend Phase 3 is complete
3. Every file must include comments explaining purpose and logic
4. Use simple, readable code over advanced abstractions
5. After each phase, provide:

   * What was built
   * How to run it
   * How to test it manually
6. Never delete user files without explicit permission

---

# Tech Stack (Fixed)

## Backend

* Node.js
* Express
* Socket.IO
* JWT Authentication
* bcrypt
* SQLite (MVP)
* dotenv

## Frontend

* React
* Tailwind CSS
* Socket.IO Client

---

# System Architecture

## Services

* REST API (Auth, Users, Chats, Messages)
* WebSocket Server (Real-time messaging)
* SQLite Database (Data persistence)

## Technical Specifications

### Ports

* Backend: `3000`
* Frontend: `3001`

### Environment Variables

Create `.env` file in backend root:

```
PORT=3000
JWT_SECRET=your_secret_key
DB_PATH=./database.sqlite
NODE_ENV=development
```

### Input Validation Rules

**Email:**
* Valid email format
* Must be unique

**Password:**
* Minimum 8 characters
* At least 1 letter
* At least 1 number

**Username:**
* 3-20 characters
* Letters, numbers, underscore only
* Must be unique

### Error Response Format

All API errors should follow a standardized format:
```json
{
  "error": "Error message here"
}
```

### Frontend Requirements

* Show all validation and server errors to users
* Use spinners/loading indicators for async operations
* Display messages with: username, message content, timestamp
* MVP-style UI (minimal but functional)

---

# Phase 0 — Project Scaffolding

## Goal

Create a clean, professional full-stack folder structure and initialize all tooling.

## Requirements

* Root folders:

  ```
  /backend
  /frontend
  ```
* Backend must include:

  ```
  /src
    /config
    /routes
    /controllers
    /middleware
    /models
    server.js
  .env.example
  package.json
  ```
* Frontend must be a React app with Tailwind installed

## Deliverables

* Initialized Node project
* Express server runs on a test route `/health`
* SQLite database file created but empty
* React app runs and shows "Chat App MVP"

Stop and wait for approval.

---

# Phase 1 — Authentication System

## Goal

Users can register, log in, and access protected routes.

## Features

* Register:

  * Username (unique)
  * Email (unique)
  * Password (hashed with bcrypt)
* Login:

  * Email or username + password
  * Returns JWT token
* JWT Middleware:

  * Protect routes
  * Attach user to request object

## API

* POST `/api/auth/register`
* POST `/api/auth/login`
* GET `/api/auth/me`

## Database

Create `users` table:

```
id
username
email
password_hash
created_at
```

## Deliverables

* Working auth endpoints
* Token-protected test route
* Manual test instructions

Stop and wait for approval.

---

# Phase 2 — User Search

## Goal

Users can find other users by username.

## Features

* Partial match search
* Exclude self from results
* Protected route

## API

* GET `/api/users/search?username=`

## Deliverables

* Search controller
* Indexed username column
* Manual test steps

Stop and wait for approval.

---

# Phase 3 — Private Chats (No Real-Time)

## Goal

Users can create and use private chats with stored message history.

## Database

Create tables:

### chats

```
id
is_group
name
created_at
```

### chat_members

```
chat_id
user_id
role
```

### messages

```
id
chat_id
sender_id
content
timestamp
```

## Features

* Create private chat between two users
* If a private chat already exists between two users, return the existing chat (do NOT return an error)
* Send message (REST)
* Fetch message history with pagination support

## API

### POST `/api/chats/private`

**Request Body:**
```json
{
  "username": "john"
}
```

**Response:** Returns existing chat if one exists, otherwise creates new chat

### GET `/api/chats`

**Response:** Returns all chats for authenticated user with metadata:
* Last message content
* Last message timestamp
* Unread count (if applicable)
* Other participant info (for private chats)

### GET `/api/messages/:chatId`

**Query Parameters:**
* `limit` (optional): Number of messages to return
* `offset` (optional): Pagination offset

**Response:** Paginated message history

### POST `/api/messages/:chatId`

**Request Body:**
```json
{
  "content": "Hello"
}
```

Stop and wait for approval.

---

# Phase 4 — Real-Time Messaging

## Goal

Messages appear instantly using WebSockets.

## Socket Rules

* Authenticate socket using JWT
* Join chat room by chat ID
* Broadcast messages to room
* Save messages to database
* Queue messages for offline users and deliver when they reconnect

## Events

### `join_chat`

**Payload:**
```json
{
  "chatId": 15
}
```

### `send_message`

**Payload:**
```json
{
  "chatId": 15,
  "content": "Hello"
}
```

### `receive_message`

**Payload:**
```json
{
  "id": 99,
  "chatId": 15,
  "sender": {
    "id": 2,
    "username": "john"
  },
  "content": "Hello",
  "timestamp": "2026-01-20T12:35:00Z"
}
```

## Additional Real-Time Features

* Typing indicators
* Read receipts
* Delivery status

Stop and wait for approval.

---

# Phase 5 — Group Chats

## Goal

Multi-user chat with admin permissions.

## Features

* Create group (creator automatically becomes admin)
* Add user by username
* Remove user
* Role enforcement
* Maximum group size: 50 members

## Roles

* `admin`: Can add/remove users, rename group
* `member`: Can leave group, send messages

## Permissions

* Creator is automatically admin
* Admins can remove other admins (but NOT the last admin)
* Members can leave groups themselves
* Only admins can rename groups

## API

### POST `/api/chats/group`

**Request Body:**
```json
{
  "name": "My Group",
  "usernames": ["user1", "user2"]
}
```

**Response:** Creates group with creator as admin

### POST `/api/chats/:chatId/add-user`

**Request Body:**
```json
{
  "username": "john"
}
```

**Permissions:** Admin only

### POST `/api/chats/:chatId/remove-user`

**Request Body:**
```json
{
  "username": "john"
}
```

**Permissions:** Admin only (cannot remove last admin)

### POST `/api/chats/:chatId/leave`

**Permissions:** Any member (including admins, but cannot leave if last admin)

### PUT `/api/chats/:chatId/rename`

**Request Body:**
```json
{
  "name": "New Group Name"
}
```

**Permissions:** Admin only

Stop and wait for approval.

---

# Phase 6 — Frontend Integration

## Pages

* Login
* Register
* Dashboard (chat list)
* Search users
* Chat window
* Group management panel

## Requirements

* Store JWT in memory or localStorage
* Protect routes
* Connect Socket.IO client
* Show real-time messages
* Display messages with username, content, and timestamp
* Show all validation and server errors to users
* Use spinners/loading indicators for async operations
* MVP-style UI (minimal but functional)

Stop and wait for approval.

---

# Completion Rules

* Code must run with `npm install` and `npm start`
* No placeholder logic
* No TODO comments left unresolved
* All endpoints must be testable via Postman or browser

---

# End of Cursor Build Spec
